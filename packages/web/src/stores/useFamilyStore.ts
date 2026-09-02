/**
 * 家庭空间状态管理（zustand）
 *
 * 空间 = 数据共享边界：业务读写都锚定 currentFamilyId（仓储层注入）。
 * 每个账号登录后自动确保有一个个人空间；成员经「邮箱邀请 → 对方接受」共享空间。
 * currentFamilyId 持久化到 localStorage；未配置云端时退化为单一本地空间。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Family, FamilyMember } from '@courseschedule/shared';
import { FamilyRepository, inviteLink } from '../data/repositories/familyRepository';
import { useAuthStore } from './useAuthStore';

const familyRepo = new FamilyRepository();

/** 供仓储层注入隔离键；空间未就绪时返回 null（云端读写会被拒绝） */
export const getCurrentFamilyId = (): string | null =>
  useFamilyStore.getState().currentFamilyId;

interface FamilyState {
  families: Family[];
  /** 当前空间的成员邀请记录（家长可见全部） */
  members: FamilyMember[];
  /** 发到我邮箱、待确认的邀请 */
  invites: FamilyMember[];
  /** 最近一次邀请：邀请链接由家长自行转发（微信/邮件），对方打开后确认 */
  lastInvite: { email: string; link: string } | null;
  currentFamilyId: string | null;
  loading: boolean;
  error: string | null;

  /** 登录后调用：拉空间列表（无则建个人空间）、待我确认的邀请，并锚定当前空间 */
  bootstrap: () => Promise<void>;
  switchFamily: (familyId: string) => void;
  createFamily: (name: string) => Promise<void>;
  renameFamily: (familyId: string, name: string) => Promise<void>;
  deleteFamily: (familyId: string) => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  dismissInvite: () => void;
  acceptInvite: (memberId: string) => Promise<void>;
  declineInvite: (memberId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  /** 成员自行退出受邀空间 */
  leaveFamily: (familyId: string) => Promise<void>;
  refreshMembers: (familyId: string) => Promise<void>;
}

const fail = (set: (p: Partial<FamilyState>) => void, err: unknown) =>
  set({ loading: false, error: (err as Error).message });

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      families: [],
      members: [],
      invites: [],
      lastInvite: null,
      currentFamilyId: null,
      loading: false,
      error: null,

      bootstrap: async () => {
        set({ loading: true, error: null });
        try {
          let families = await familyRepo.listMine();
          if (families.length === 0) {
            const uid = useAuthStore.getState().session?.user.id;
            if (!uid) throw new Error('未登录，无法创建个人空间');
            const personal = await familyRepo.create('我的空间', uid);
            families = [personal];
          }
          const email = useAuthStore.getState().session?.user.email ?? '';
          const invites = email ? await familyRepo.listInvitesForEmail(email) : [];

          const stored = get().currentFamilyId;
          const currentFamilyId =
            families.find((f) => f.id === stored)?.id ?? families[0].id;

          set({ families, invites, currentFamilyId, loading: false });
          await get().refreshMembers(currentFamilyId);
        } catch (err) {
          fail(set, err);
        }
      },

      switchFamily: (familyId) => {
        if (!get().families.some((f) => f.id === familyId)) return;
        set({ currentFamilyId: familyId });
        // 科目重载与页面刷新由调用方（FamilyPage）负责，避免与 useSubjectStore 循环依赖
      },

      createFamily: async (name) => {
        const uid = useAuthStore.getState().session?.user.id;
        if (!uid) return;
        try {
          const family = await familyRepo.create(name.trim(), uid);
          set({ families: [...get().families, family], currentFamilyId: family.id });
          await get().refreshMembers(family.id);
        } catch (err) {
          fail(set, err);
        }
      },

      renameFamily: async (familyId, name) => {
        try {
          await familyRepo.rename(familyId, name.trim());
          set({
            families: get().families.map((f) =>
              f.id === familyId ? { ...f, name: name.trim(), updatedAt: Date.now() } : f
            ),
          });
        } catch (err) {
          fail(set, err);
        }
      },

      deleteFamily: async (familyId) => {
        try {
          await familyRepo.remove(familyId);
          const rest = get().families.filter((f) => f.id !== familyId);
          set({ families: rest, members: [] });
          if (get().currentFamilyId === familyId) {
            if (rest.length === 0) {
              await get().bootstrap();
            } else {
              get().switchFamily(rest[0].id);
            }
          }
        } catch (err) {
          fail(set, err);
        }
      },

      inviteMember: async (email) => {
        const familyId = get().currentFamilyId;
        if (!familyId) return;
        try {
          const member = await familyRepo.invite(familyId, email);
          set({
            members: [...get().members, member],
            lastInvite: { email: member.email, link: inviteLink(member.id) },
          });
        } catch (err) {
          fail(set, err);
        }
      },

      dismissInvite: () => set({ lastInvite: null }),

      acceptInvite: async (memberId) => {
        const uid = useAuthStore.getState().session?.user.id;
        if (!uid) return;
        const joined = get().invites.find((i) => i.id === memberId)?.familyId;
        try {
          await familyRepo.respond(memberId, uid, true);
          set({ invites: get().invites.filter((i) => i.id !== memberId) });
          await get().bootstrap();
          // 加入后直接落到共享空间，科目重载由路由守卫 / 调用方负责
          if (joined && get().families.some((f) => f.id === joined)) {
            get().switchFamily(joined);
          }
        } catch (err) {
          fail(set, err);
        }
      },

      declineInvite: async (memberId) => {
        const uid = useAuthStore.getState().session?.user.id;
        if (!uid) return;
        try {
          await familyRepo.respond(memberId, uid, false);
          set({ invites: get().invites.filter((i) => i.id !== memberId) });
        } catch (err) {
          fail(set, err);
        }
      },

      removeMember: async (memberId) => {
        try {
          await familyRepo.removeMember(memberId);
          set({ members: get().members.filter((m) => m.id !== memberId) });
        } catch (err) {
          fail(set, err);
        }
      },

      leaveFamily: async (familyId) => {
        const email = useAuthStore.getState().session?.user.email?.toLowerCase();
        const me = (await familyRepo.listMembers(familyId)).find(
          (m) => m.email.toLowerCase() === email && m.status === 'accepted'
        );
        if (!me) return;
        try {
          await familyRepo.removeMember(me.id);
          set({ families: get().families.filter((f) => f.id !== familyId) });
          if (get().currentFamilyId === familyId) {
            const rest = get().families;
            if (rest.length === 0) {
              await get().bootstrap();
            } else {
              get().switchFamily(rest[0].id);
            }
          }
        } catch (err) {
          fail(set, err);
        }
      },

      refreshMembers: async (familyId) => {
        try {
          set({ members: await familyRepo.listMembers(familyId) });
        } catch (err) {
          fail(set, err);
        }
      },
    }),
    {
      name: 'courseschedule-family-store',
      partialize: (state) => ({ currentFamilyId: state.currentFamilyId }),
    }
  )
);

/** 当前账号是否为某空间的家长 */
export const useIsFamilyOwner = (familyId: string | null): boolean => {
  const uid = useAuthStore((state) => state.session?.user.id);
  const family = useFamilyStore((state) =>
    state.families.find((f) => f.id === familyId)
  );
  return Boolean(uid && family && family.ownerUserId === uid);
};
