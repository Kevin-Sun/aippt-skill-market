// AI智作PPT模版社 · skill 数据（V4 每个skill独立评价）

var skills = [
  {
    id: 'work-report-pro',
    name: '工作汇报 PPT 全流程生成',
    previewDesc: '模仿万元/页级 PPT 设计公司工作流',
    scene: '工作汇报',
    style: '商务简约',
    styleTag: '商务简约',
    language: '中文',
    price: 9,
    isFree: false,
    recommendedAgent: 'Codex',
    gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    previewImages: ['/images/skills/work-report-01.jpg'],
    includes: { templates: 12, layouts: 8, colorSchemes: 5 },
    rating: 4.8,
    salesCount: 1256,
    suitableFor: ['年终总结', '季度汇报', '项目复盘', '述职报告'],
    steps: [
      { num: 1, title: '选场景', desc: '选择工作汇报场景和风格' },
      { num: 2, title: '填内容', desc: '输入汇报要点和数据' },
      { num: 3, title: '生成', desc: 'AI 自动生成 PPT' },
      { num: 4, title: '导出', desc: '导出 PPTX 或 PDF' },
    ],
    reviews: [
      { user: '打工人小王', avatar: 'https://i.pravatar.cc/150?img=12', rating: 5, text: '真的救了我一命😭 周五要汇报周四晚上才开始做，用这个10分钟出稿，领导还问我是不是请外援了哈哈', date: '2026-07-25' },
      { user: '周报写不完', avatar: 'https://i.pravatar.cc/150?img=23', rating: 5, text: '姐妹们冲！数据图表自动生成就很绝🚀 我只要把数字填进去就行', date: '2026-07-23' },
    ],
    related: ['work-report-basic', 'consulting-report'],
  },
  {
    id: 'work-report-basic',
    name: '基础工作汇报 PPT',
    previewDesc: '免费导流品：基础工作汇报模板',
    scene: '工作汇报',
    style: '商务简约',
    styleTag: '商务简约',
    language: '中文',
    price: 0,
    isFree: true,
    recommendedAgent: '豆包',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    previewImages: ['/images/skills/work-report-free.jpg'],
    includes: { templates: 5, layouts: 3, colorSchemes: 2 },
    rating: 4.2,
    salesCount: 3421,
    suitableFor: ['周报', '月报', '简报'],
    steps: [
      { num: 1, title: '选模板', desc: '选择基础模板' },
      { num: 2, title: '填内容', desc: '输入汇报内容' },
      { num: 3, title: '生成', desc: '生成基础 PPT' },
    ],
    reviews: [
      { user: '实习生小赵', avatar: 'https://i.pravatar.cc/150?img=41', rating: 4, text: '免费版够用了，基础模板就行🤔 付费版更丰富', date: '2026-07-19' },
    ],
    related: ['work-report-pro'],
  },
  {
    id: 'thesis-defense',
    name: '科研答辩 PPT 生成',
    previewDesc: '科研答辩风格，清爽专业风',
    scene: '答辩',
    style: '学术清爽',
    styleTag: '学术清爽',
    language: '中文',
    price: 9,
    isFree: false,
    recommendedAgent: '豆包',
    gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    previewImages: ['/images/skills/defense-01.jpg'],
    includes: { templates: 10, layouts: 6, colorSchemes: 4 },
    rating: 4.9,
    salesCount: 892,
    suitableFor: ['毕业答辩', '开题报告', '中期检查', '论文答辩'],
    steps: [
      { num: 1, title: '选学科', desc: '选择学科和研究方向' },
      { num: 2, title: '输入论文', desc: '粘贴论文摘要和关键词' },
      { num: 3, title: '生成', desc: 'AI 生成答辩 PPT' },
      { num: 4, title: '调整', desc: '微调内容和排版' },
    ],
    reviews: [
      { user: '答辩焦虑中', avatar: 'https://i.pravatar.cc/150?img=8', rating: 5, text: '开题答辩过了！导师说 PPT 做得清爽🎓 救命这个模板太香了', date: '2026-07-24' },
      { user: '研三狗', avatar: 'https://i.pravatar.cc/150?img=15', rating: 5, text: '图表布局超合理，我数据直接填进去就行📊', date: '2026-07-22' },
    ],
    related: ['thesis-defense-basic', 'academic-paper'],
  },
  {
    id: 'thesis-defense-basic',
    name: '基础答辩 PPT',
    previewDesc: '免费导流品：基础答辩模板',
    scene: '答辩',
    style: '学术清爽',
    styleTag: '学术清爽',
    language: '中文',
    price: 0,
    isFree: true,
    recommendedAgent: '豆包',
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    previewImages: ['/images/skills/defense-free.jpg'],
    includes: { templates: 4, layouts: 2, colorSchemes: 2 },
    rating: 4.0,
    salesCount: 1567,
    suitableFor: ['课程答辩', '小组展示'],
    steps: [
      { num: 1, title: '选模板', desc: '选择基础答辩模板' },
      { num: 2, title: '填内容', desc: '输入答辩内容' },
      { num: 3, title: '生成', desc: '生成基础 PPT' },
    ],
    reviews: [
      { user: '毕业冲刺中', avatar: 'https://i.pravatar.cc/150?img=27', rating: 4, text: '答辩前一天才发现这个😱 熬夜改完，居然拿了优秀论文🙏', date: '2026-07-19' },
    ],
    related: ['thesis-defense'],
  },
  {
    id: 'academic-paper',
    name: '学术论文 PPT 生成',
    previewDesc: '学术 PPT skill，英文论文展示',
    scene: '学术研究',
    style: '学术清爽',
    styleTag: '学术清爽',
    language: '英文',
    price: 9,
    isFree: false,
    recommendedAgent: 'Codex',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    previewImages: ['/images/skills/academic-01.jpg'],
    includes: { templates: 8, layouts: 5, colorSchemes: 3 },
    rating: 4.7,
    salesCount: 456,
    suitableFor: ['学术会议', '论文展示', '研究汇报'],
    steps: [
      { num: 1, title: '选领域', desc: '选择学术领域' },
      { num: 2, title: '输入论文', desc: '粘贴论文内容' },
      { num: 3, title: '生成', desc: 'AI 生成学术 PPT' },
    ],
    reviews: [
      { user: '博士生小张', avatar: 'https://i.pravatar.cc/150?img=38', rating: 5, text: '学术英文 PPT skill 很好用，国际会议汇报被外国教授夸了👍', date: '2026-07-16' },
    ],
    related: ['thesis-defense'],
  },
  {
    id: 'consulting-report',
    name: '咨询报告 PPT 生成',
    previewDesc: '麦肯锡风咨询报告，数据驱动',
    scene: '商务展示',
    style: '商务简约',
    styleTag: '商务简约',
    language: '中文',
    price: 19,
    isFree: false,
    recommendedAgent: 'WorkBuddy',
    gradient: 'linear-gradient(135deg, #0f172a, #334155)',
    previewImages: ['/images/skills/corporate-01.jpg'],
    includes: { templates: 15, layouts: 10, colorSchemes: 6 },
    rating: 4.9,
    salesCount: 345,
    suitableFor: ['商业计划书', '投资路演', '战略汇报', '行业分析'],
    steps: [
      { num: 1, title: '选场景', desc: '选择商务展示场景' },
      { num: 2, title: '输入数据', desc: '粘贴数据和关键发现' },
      { num: 3, title: '生成', desc: 'AI 生成咨询报告 PPT' },
      { num: 4, title: '导出', desc: '导出 PPTX' },
    ],
    reviews: [
      { user: '咨询顾问乙方', avatar: 'https://i.pravatar.cc/150?img=5', rating: 5, text: '客户直接问是哪家设计公司做的😂 麦肯锡风真的绝', date: '2026-07-23' },
      { user: '数据分析师', avatar: 'https://i.pravatar.cc/150?img=18', rating: 4, text: '数据可视化很专业，模板可以再多一些', date: '2026-07-21' },
    ],
    related: ['work-report-pro'],
  },
  {
    id: 'creative-pitch',
    name: '创意提案 PPT 生成',
    previewDesc: '创意活泼风，适合营销提案',
    scene: '商务展示',
    style: '创意活泼',
    styleTag: '创意活泼',
    language: '中文',
    price: 9,
    isFree: false,
    recommendedAgent: '豆包',
    gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    previewImages: ['/images/skills/corporate-deck-01.jpg'],
    includes: { templates: 8, layouts: 5, colorSchemes: 4 },
    rating: 4.6,
    salesCount: 678,
    suitableFor: ['营销提案', '品牌策划', '活动方案', '创意展示'],
    steps: [
      { num: 1, title: '选风格', desc: '选择创意风格' },
      { num: 2, title: '输入内容', desc: '输入提案要点' },
      { num: 3, title: '生成', desc: 'AI 生成创意 PPT' },
    ],
    reviews: [
      { user: '品牌设计师小美', avatar: 'https://i.pravatar.cc/150?img=48', rating: 4, text: '创意活泼风很适合提案！配色还可以更大胆一些🎨', date: '2026-07-17' },
    ],
    related: ['consulting-report'],
  },
  {
    id: 'tech-presentation',
    name: '科技极简 PPT 生成',
    previewDesc: '科技极简风，适合产品发布',
    scene: '商务展示',
    style: '科技极简',
    styleTag: '科技极简',
    language: '中文',
    price: 9,
    isFree: false,
    recommendedAgent: 'Codex',
    gradient: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
    previewImages: ['/images/skills/thesis-defense-01.jpg'],
    includes: { templates: 6, layouts: 4, colorSchemes: 3 },
    rating: 4.5,
    salesCount: 523,
    suitableFor: ['产品发布', '技术分享', '行业大会'],
    steps: [
      { num: 1, title: '选主题', desc: '选择科技主题' },
      { num: 2, title: '输入内容', desc: '输入技术要点' },
      { num: 3, title: '生成', desc: 'AI 生成科技 PPT' },
    ],
    reviews: [
      { user: '程序员阿杰', avatar: 'https://i.pravatar.cc/150?img=56', rating: 5, text: '技术分享用它做 PPT，代码块和架构图渲染得很专业💪', date: '2026-07-15' },
    ],
    related: ['consulting-report', 'creative-pitch'],
  },
];

function getSkillsByScene(scene) {
  if (!scene || scene === '全部') return skills;
  return skills.filter(function(s) { return s.scene === scene; });
}

function getSkillsByStyle(style) {
  if (!style || style === '全部') return skills;
  return skills.filter(function(s) { return s.style === style; });
}

function getFreeSkills() {
  return skills.filter(function(s) { return s.isFree; });
}

function getSkillById(id) {
  return skills.find(function(s) { return s.id === id; });
}

function getRelatedSkills(id) {
  var skill = getSkillById(id);
  if (!skill || !skill.related) return [];
  return skill.related.map(function(rid) { return getSkillById(rid); }).filter(Boolean);
}

module.exports = {
  skills: skills,
  getSkillsByScene: getSkillsByScene,
  getSkillsByStyle: getSkillsByStyle,
  getFreeSkills: getFreeSkills,
  getSkillById: getSkillById,
  getRelatedSkills: getRelatedSkills,
};
