/**
 * 今日一句 —— 江苏省（统编版）小学低段必背古诗词与名言警句
 *
 * 内容按「开学日起第几天」固定映射到一条，一天一条、覆盖整学期。
 * 池子顺序经四类（古诗 / 名言 / 启蒙经典 / 成语）交错编排，避免同类扎堆。
 * 出处以统编语文教材与课标推荐背诵篇目为主，个别经典启蒙句标注书名。
 */

import type { ISODate } from '../domain/models';
import { parseISODate } from './utils/date';

/** 条目类别 */
export type RecitationKind = 'poem' | 'saying' | 'classic' | 'idiom';

/** 今日一句条目 */
export interface RecitationItem {
  /** 背诵正文 */
  text: string;
  /** 出处（作者·篇名 / 书名） */
  source: string;
  /** 类别 */
  kind: RecitationKind;
}

/** 类别中文名（用于界面角标） */
export const RECITATION_KIND_LABEL: Record<RecitationKind, string> = {
  poem: '古诗',
  saying: '名言',
  classic: '启蒙',
  idiom: '成语',
};

/* ─────────────── 古诗名句 ─────────────── */

const POEMS: RecitationItem[] = [
  { text: '白毛浮绿水，红掌拨清波。', source: '骆宾王《咏鹅》', kind: 'poem' },
  { text: '江南可采莲，莲叶何田田。', source: '汉乐府《江南》', kind: 'poem' },
  { text: '春去花还在，人来鸟不惊。', source: '佚名《画》', kind: 'poem' },
  { text: '谁知盘中餐，粒粒皆辛苦。', source: '李绅《悯农》', kind: 'poem' },
  { text: '小时不识月，呼作白玉盘。', source: '李白《古朗月行》', kind: 'poem' },
  { text: '过江千尺浪，入竹万竿斜。', source: '李峤《风》', kind: 'poem' },
  { text: '春眠不觉晓，处处闻啼鸟。', source: '孟浩然《春晓》', kind: 'poem' },
  { text: '桃花潭水深千尺，不及汪伦送我情。', source: '李白《赠汪伦》', kind: 'poem' },
  { text: '举头望明月，低头思故乡。', source: '李白《静夜思》', kind: 'poem' },
  { text: '只在此山中，云深不知处。', source: '贾岛《寻隐者不遇》', kind: 'poem' },
  { text: '不解藏踪迹，浮萍一道开。', source: '白居易《池上》', kind: 'poem' },
  { text: '小荷才露尖尖角，早有蜻蜓立上头。', source: '杨万里《小池》', kind: 'poem' },
  { text: '平生不敢轻言语，一叫千门万户开。', source: '唐寅《画鸡》', kind: 'poem' },
  { text: '遥知不是雪，为有暗香来。', source: '王安石《梅花》', kind: 'poem' },
  { text: '路人借问遥招手，怕得鱼惊不应人。', source: '胡令能《小儿垂钓》', kind: 'poem' },
  { text: '欲穷千里目，更上一层楼。', source: '王之涣《登鹳雀楼》', kind: 'poem' },
  { text: '飞流直下三千尺，疑是银河落九天。', source: '李白《望庐山瀑布》', kind: 'poem' },
  { text: '孤舟蓑笠翁，独钓寒江雪。', source: '柳宗元《江雪》', kind: 'poem' },
  { text: '不敢高声语，恐惊天上人。', source: '李白《夜宿山寺》', kind: 'poem' },
  { text: '天苍苍，野茫茫，风吹草低见牛羊。', source: '北朝民歌《敕勒歌》', kind: 'poem' },
  { text: '儿童散学归来早，忙趁东风放纸鸢。', source: '高鼎《村居》', kind: 'poem' },
  { text: '不知细叶谁裁出，二月春风似剪刀。', source: '贺知章《咏柳》', kind: 'poem' },
  { text: '野火烧不尽，春风吹又生。', source: '白居易《赋得古原草送别》', kind: 'poem' },
  { text: '接天莲叶无穷碧，映日荷花别样红。', source: '杨万里《晓出净慈寺送林子方》', kind: 'poem' },
  { text: '两个黄鹂鸣翠柳，一行白鹭上青天。', source: '杜甫《绝句》', kind: 'poem' },
  { text: '春种一粒粟，秋收万颗子。', source: '李绅《悯农·其一》', kind: 'poem' },
  { text: '微微风簇浪，散作满河星。', source: '查慎行《舟夜书所见》', kind: 'poem' },
  { text: '意欲捕鸣蝉，忽然闭口立。', source: '袁枚《所见》', kind: 'poem' },
  { text: '停车坐爱枫林晚，霜叶红于二月花。', source: '杜牧《山行》', kind: 'poem' },
  { text: '月落乌啼霜满天，江枫渔火对愁眠。', source: '张继《枫桥夜泊》', kind: 'poem' },
  { text: '谁言寸草心，报得三春晖。', source: '孟郊《游子吟》', kind: 'poem' },
  { text: '爆竹声中一岁除，春风送暖入屠苏。', source: '王安石《元日》', kind: 'poem' },
  { text: '清明时节雨纷纷，路上行人欲断魂。', source: '杜牧《清明》', kind: 'poem' },
  { text: '儿童相见不相识，笑问客从何处来。', source: '贺知章《回乡偶书》', kind: 'poem' },
  { text: '两岸猿声啼不住，轻舟已过万重山。', source: '李白《早发白帝城》', kind: 'poem' },
  { text: '两岸青山相对出，孤帆一片日边来。', source: '李白《望天门山》', kind: 'poem' },
  { text: '欲把西湖比西子，淡妆浓抹总相宜。', source: '苏轼《饮湖上初晴后雨》', kind: 'poem' },
  { text: '竹外桃花三两枝，春江水暖鸭先知。', source: '苏轼《惠崇春江晚景》', kind: 'poem' },
  { text: '绿阴不减来时路，添得黄鹂四五声。', source: '曾几《三衢道中》', kind: 'poem' },
  { text: '日出江花红胜火，春来江水绿如蓝。', source: '白居易《忆江南》', kind: 'poem' },
  { text: '随风潜入夜，润物细无声。', source: '杜甫《春夜喜雨》', kind: 'poem' },
  { text: '但使龙城飞将在，不教胡马度阴山。', source: '王昌龄《出塞》', kind: 'poem' },
  { text: '洛阳亲友如相问，一片冰心在玉壶。', source: '王昌龄《芙蓉楼送辛渐》', kind: 'poem' },
  { text: '空山不见人，但闻人语响。', source: '王维《鹿柴》', kind: 'poem' },
  { text: '劝君更尽一杯酒，西出阳关无故人。', source: '王维《送元二使安西》', kind: 'poem' },
  { text: '遥望洞庭山水翠，白银盘里一青螺。', source: '刘禹锡《望洞庭》', kind: 'poem' },
  { text: '童孙未解供耕织，也傍桑阴学种瓜。', source: '范成大《四时田园杂兴》', kind: 'poem' },
  { text: '牧童归去横牛背，短笛无腔信口吹。', source: '雷震《村晚》', kind: 'poem' },
  { text: '不识庐山真面目，只缘身在此山中。', source: '苏轼《题西林壁》', kind: 'poem' },
  { text: '孤帆远影碧空尽，唯见长江天际流。', source: '李白《黄鹤楼送孟浩然之广陵》', kind: 'poem' },
];

/* ─────────────── 名言警句 / 谚语 / 惯用语 ─────────────── */

const SAYINGS: RecitationItem[] = [
  { text: '一年之计在于春，一日之计在于晨。', source: '《增广贤文》', kind: 'saying' },
  { text: '一寸光阴一寸金，寸金难买寸光阴。', source: '《增广贤文》', kind: 'saying' },
  { text: '少壮不努力，老大徒伤悲。', source: '汉乐府《长歌行》', kind: 'saying' },
  { text: '读书百遍，而义自见。', source: '《三国志》注引', kind: 'saying' },
  { text: '千里之行，始于足下。', source: '《老子》', kind: 'saying' },
  { text: '百尺竿头，更进一步。', source: '《景德传灯录》', kind: 'saying' },
  { text: '己所不欲，勿施于人。', source: '《论语》', kind: 'saying' },
  { text: '与朋友交，言而有信。', source: '《论语》', kind: 'saying' },
  { text: '敏而好学，不耻下问。', source: '《论语》', kind: 'saying' },
  { text: '三人行，必有我师焉。', source: '《论语》', kind: 'saying' },
  { text: '温故而知新，可以为师矣。', source: '《论语》', kind: 'saying' },
  { text: '学而不思则罔，思而不学则殆。', source: '《论语》', kind: 'saying' },
  { text: '见贤思齐焉，见不贤而内自省也。', source: '《论语》', kind: 'saying' },
  { text: '不迁怒，不贰过。', source: '《论语》', kind: 'saying' },
  { text: '树无根不长，人无志不立。', source: '谚语', kind: 'saying' },
  { text: '灯不拨不亮，理不辩不明。', source: '谚语', kind: 'saying' },
  { text: '有理走遍天下，无理寸步难行。', source: '谚语', kind: 'saying' },
  { text: '一时强弱在于力，万古胜负在于理。', source: '谚语', kind: 'saying' },
  { text: '人心齐，泰山移。', source: '谚语', kind: 'saying' },
  { text: '二人同心，其利断金。', source: '《周易》', kind: 'saying' },
  { text: '三个臭皮匠，顶个诸葛亮。', source: '谚语', kind: 'saying' },
  { text: '一个篱笆三个桩，一个好汉三个帮。', source: '谚语', kind: 'saying' },
  { text: '尺有所短，寸有所长。', source: '《楚辞》', kind: 'saying' },
  { text: '机不可失，时不再来。', source: '《旧五代史》', kind: 'saying' },
  { text: '差之毫厘，谬以千里。', source: '《礼记》', kind: 'saying' },
  { text: '一言既出，驷马难追。', source: '《论语》', kind: 'saying' },
  { text: '兵来将挡，水来土掩。', source: '元曲', kind: 'saying' },
  { text: '近朱者赤，近墨者黑。', source: '晋·傅玄', kind: 'saying' },
  { text: '绳锯木断，水滴石穿。', source: '宋·罗大经', kind: 'saying' },
  { text: '锲而不舍，金石可镂。', source: '《荀子·劝学》', kind: 'saying' },
  { text: '比上不足，比下有余。', source: '《千字文》注', kind: 'saying' },
  { text: '黑发不知勤学早，白首方悔读书迟。', source: '颜真卿《劝学》', kind: 'saying' },
  { text: '书山有路勤为径，学海无涯苦作舟。', source: '韩愈《古今贤文》', kind: 'saying' },
  { text: '世上无难事，只要肯登攀。', source: '毛泽东', kind: 'saying' },
  { text: '只要功夫深，铁杵磨成针。', source: '谚语', kind: 'saying' },
  { text: '拳不离手，曲不离口。', source: '谚语', kind: 'saying' },
  { text: '好记性不如烂笔头。', source: '谚语', kind: 'saying' },
  { text: '路遥知马力，日久见人心。', source: '元曲', kind: 'saying' },
  { text: '满招损，谦受益。', source: '《尚书》', kind: 'saying' },
  { text: '虚心万事能成，自满十事九空。', source: '谚语', kind: 'saying' },
  { text: '学如逆水行舟，不进则退。', source: '《增广贤文》', kind: 'saying' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', source: '韩愈《进学解》', kind: 'saying' },
  { text: '书犹药也，善读之可以医愚。', source: '汉·刘向', kind: 'saying' },
  { text: '读万卷书，行万里路。', source: '明·董其昌', kind: 'saying' },
  { text: '为中华之崛起而读书。', source: '周恩来', kind: 'saying' },
  { text: '聪明出于勤奋，天才在于积累。', source: '华罗庚', kind: 'saying' },
  { text: '失败是成功之母。', source: '谚语', kind: 'saying' },
  { text: '兴趣是最好的老师。', source: '爱因斯坦', kind: 'saying' },
  { text: '朝霞不出门，晚霞行千里。', source: '气象谚语', kind: 'saying' },
  { text: '有雨山戴帽，无雨半山腰。', source: '气象谚语', kind: 'saying' },
  { text: '早晨下雨当日晴，晚上下雨到天明。', source: '气象谚语', kind: 'saying' },
  { text: '蚂蚁搬家蛇过道，大雨不久要来到。', source: '气象谚语', kind: 'saying' },
  { text: '久晴大雾必阴，久雨大雾必晴。', source: '气象谚语', kind: 'saying' },
  { text: '一场秋雨一场寒，十场秋雨要穿棉。', source: '气象谚语', kind: 'saying' },
  { text: '瑞雪兆丰年。', source: '农谚', kind: 'saying' },
];

/* ─────────────── 启蒙经典（三字经 / 弟子规 / 千字文 / 笠翁对韵） ─────────────── */

const CLASSICS: RecitationItem[] = [
  { text: '人之初，性本善。', source: '《三字经》', kind: 'classic' },
  { text: '性相近，习相远。', source: '《三字经》', kind: 'classic' },
  { text: '苟不教，性乃迁。', source: '《三字经》', kind: 'classic' },
  { text: '教之道，贵以专。', source: '《三字经》', kind: 'classic' },
  { text: '玉不琢，不成器。', source: '《三字经》', kind: 'classic' },
  { text: '人不学，不知义。', source: '《三字经》', kind: 'classic' },
  { text: '为人子，方少时。', source: '《三字经》', kind: 'classic' },
  { text: '亲师友，习礼仪。', source: '《三字经》', kind: 'classic' },
  { text: '香九龄，能温席。', source: '《三字经》', kind: 'classic' },
  { text: '融四岁，能让梨。', source: '《三字经》', kind: 'classic' },
  { text: '养不教，父之过。', source: '《三字经》', kind: 'classic' },
  { text: '教不严，师之惰。', source: '《三字经》', kind: 'classic' },
  { text: '犬守夜，鸡司晨。', source: '《三字经》', kind: 'classic' },
  { text: '蚕吐丝，蜂酿蜜。', source: '《三字经》', kind: 'classic' },
  { text: '幼而学，壮而行。', source: '《三字经》', kind: 'classic' },
  { text: '弟子规，圣人训。首孝悌，次谨信。', source: '《弟子规》', kind: 'classic' },
  { text: '父母呼，应勿缓。父母命，行勿懒。', source: '《弟子规》', kind: 'classic' },
  { text: '朝起早，夜眠迟。老易至，惜此时。', source: '《弟子规》', kind: 'classic' },
  { text: '置冠服，有定位。勿乱顿，致污秽。', source: '《弟子规》', kind: 'classic' },
  { text: '对饮食，勿拣择。食适可，勿过则。', source: '《弟子规》', kind: 'classic' },
  { text: '步从容，立端正。', source: '《弟子规》', kind: 'classic' },
  { text: '凡出言，信为先。', source: '《弟子规》', kind: 'classic' },
  { text: '天地玄黄，宇宙洪荒。', source: '《千字文》', kind: 'classic' },
  { text: '日月盈昃，辰宿列张。', source: '《千字文》', kind: 'classic' },
  { text: '寒来暑往，秋收冬藏。', source: '《千字文》', kind: 'classic' },
  { text: '云腾致雨，露结为霜。', source: '《千字文》', kind: 'classic' },
  { text: '金生丽水，玉出昆冈。', source: '《千字文》', kind: 'classic' },
  { text: '知过必改，得能莫忘。', source: '《千字文》', kind: 'classic' },
  { text: '尺璧非宝，寸阴是竞。', source: '《千字文》', kind: 'classic' },
  { text: '性静情逸，心动神疲。', source: '《千字文》', kind: 'classic' },
  { text: '天对地，雨对风。大陆对长空。', source: '《笠翁对韵》', kind: 'classic' },
  { text: '山花对海树，赤日对苍穹。', source: '《笠翁对韵》', kind: 'classic' },
];

/* ─────────────── 成语（寓言故事） ─────────────── */

const IDIOMS: RecitationItem[] = [
  { text: '守株待兔', source: '《韩非子》', kind: 'idiom' },
  { text: '掩耳盗铃', source: '《吕氏春秋》', kind: 'idiom' },
  { text: '亡羊补牢', source: '《战国策》', kind: 'idiom' },
  { text: '画蛇添足', source: '《战国策》', kind: 'idiom' },
  { text: '井底之蛙', source: '《庄子》', kind: 'idiom' },
  { text: '狐假虎威', source: '《战国策》', kind: 'idiom' },
  { text: '拔苗助长', source: '《孟子》', kind: 'idiom' },
  { text: '刻舟求剑', source: '《吕氏春秋》', kind: 'idiom' },
  { text: '螳螂捕蝉，黄雀在后', source: '《庄子·山木》', kind: 'idiom' },
  { text: '叶公好龙', source: '汉·刘向《新序》', kind: 'idiom' },
];

/** 交错合并四类，避免同类连续扎堆；某类用尽后其余继续轮转 */
function interleave(...lists: RecitationItem[][]): RecitationItem[] {
  const out: RecitationItem[] = [];
  for (let i = 0; ; i++) {
    let added = false;
    for (const list of lists) {
      if (i < list.length) {
        out.push(list[i]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

/** 今日一句总池（约 150 条，覆盖整学期一天一条） */
export const RECITATION_POOL: RecitationItem[] = interleave(POEMS, SAYINGS, CLASSICS, IDIOMS);

/** 默认学期起始日（与课表导入一致） */
export const RECITATION_SEMESTER_START: ISODate = '2026-09-01';

/** 两个 ISODate 相差的天数（b - a），按本地日历日计算 */
function daysBetween(a: ISODate, b: ISODate): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * 取某天的「今日一句」：按开学日起第几天固定映射，循环取池。
 * @param date 目标日期 YYYY-MM-DD
 * @param start 学期起始日（默认 2026-09-01）
 */
export function getDailyRecitation(
  date: ISODate,
  start: ISODate = RECITATION_SEMESTER_START
): RecitationItem {
  const n = RECITATION_POOL.length;
  const dayIndex = daysBetween(start, date);
  const idx = ((dayIndex % n) + n) % n;
  return RECITATION_POOL[idx];
}
