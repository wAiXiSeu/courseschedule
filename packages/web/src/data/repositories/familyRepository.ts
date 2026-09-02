/**
 * 家庭空间 Repository
 *
 * families / familyMembers 两张表的操作集合。
 * Family / FamilyMember 不是 BaseEntity 形状（无 childId），故不继承 TableRepository；
 * 未配置 Supabase 时回退为「单一本地空间」，邀请类操作明确拒绝。
 */

import type { Family, FamilyMember } from '@courseschedule/shared';
import { genId } from '@courseschedule/shared';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * 邀请确认链接 —— 家长复制后通过微信/邮件转发给受邀人。
 * 不依赖 Supabase 发信：GoTrue 的 /auth/v1/invite 要求 service role 密钥，
 * 浏览器里用登录用户 JWT 调用必然 403 not_admin。
 */
export const inviteLink = (memberId: string): string =>
  `${window.location.origin}/join?m=${encodeURIComponent(memberId)}`;

/** 本地试玩模式的固定空间 */
const LOCAL_FAMILY: Family = {
  id: 'local',
  ownerUserId: 'local',
  name: '我的空间',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function fail(action: string, message: string): never {
  throw new Error(`[Supabase] 家庭空间${action}失败：${message}`);
}

const cloud = () => {
  if (!supabase) throw new Error('[Supabase] 客户端未初始化');
  return supabase;
};

export class FamilyRepository {
  /** 我拥有或已加入的家庭（RLS 已限定可见范围） */
  async listMine(): Promise<Family[]> {
    if (!isSupabaseConfigured) return [{ ...LOCAL_FAMILY }];
    const { data, error } = await cloud().from('families').select('*');
    if (error) fail('查询', error.message);
    return (data ?? []) as Family[];
  }

  /** 新建空间（ownerUserId 必须是当前账号，RLS 校验） */
  async create(name: string, ownerUserId: string): Promise<Family> {
    if (!isSupabaseConfigured) {
      return { ...LOCAL_FAMILY, name };
    }
    const now = Date.now();
    const family: Family = { id: genId(), ownerUserId, name, createdAt: now, updatedAt: now };
    const { error } = await cloud().from('families').insert(family);
    if (error) fail('创建', error.message);
    return family;
  }

  async rename(id: string, name: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await cloud()
      .from('families')
      .update({ name, updatedAt: Date.now() })
      .eq('id', id);
    if (error) fail('改名', error.message);
  }

  /** 删除空间（仅家长；成员行随外键级联删除） */
  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await cloud().from('families').delete().eq('id', id);
    if (error) fail('删除', error.message);
  }

  /** 某空间的成员邀请记录（家长可见全部） */
  async listMembers(familyId: string): Promise<FamilyMember[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await cloud()
      .from('familyMembers')
      .select('*')
      .eq('familyId', familyId);
    if (error) fail('查询成员', error.message);
    return (data ?? []) as FamilyMember[];
  }

  /** 发邀请（仅家长，DB 策略强制 status=pending、invitedBy/userId 由服务端写） */
  async invite(familyId: string, email: string): Promise<FamilyMember> {
    if (!isSupabaseConfigured) {
      throw new Error('本地试玩模式未接入云端，无法邀请成员：请配置 .env 后使用');
    }
    const now = Date.now();
    const { data, error } = await supabase!
      .from('familyMembers')
      .insert({
        id: genId(),
        familyId,
        email: email.trim().toLowerCase(),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .select('*')
      .single();
    if (error) fail('邀请', error.message);
    return data as FamilyMember;
  }

  /** 受邀人接受 / 拒绝（userId 由调用方从会话取当前账号 ID） */
  async respond(memberId: string, userId: string, accept: boolean): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await cloud()
      .from('familyMembers')
      .update({
        userId: accept ? userId : null,
        status: accept ? 'accepted' : 'declined',
        updatedAt: Date.now(),
      })
      .eq('id', memberId);
    if (error) fail('确认邀请', error.message);
  }

  /** 我的邮箱收到的待确认邀请 */
  async listInvitesForEmail(email: string): Promise<FamilyMember[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await cloud()
      .from('familyMembers')
      .select('*')
      .eq('status', 'pending')
      .ilike('email', email.trim().toLowerCase());
    if (error) fail('查询邀请', error.message);
    return (data ?? []) as FamilyMember[];
  }

  /** 移除成员 / 成员自行退出（RLS 允许家长或本人） */
  async removeMember(memberId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await cloud().from('familyMembers').delete().eq('id', memberId);
    if (error) fail('移除成员', error.message);
  }
}
