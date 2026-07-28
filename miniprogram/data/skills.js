"use strict";
// AI智作PPT模版社 · skill 数据（M0 骨架）
// 从 raw-materials re-tag 结果精选的 skill 列表
Object.defineProperty(exports, "__esModule", { value: true });
exports.skills = void 0;
exports.getSkillsByScene = getSkillsByScene;
exports.getSkillsByStyle = getSkillsByStyle;
exports.getFreeSkills = getFreeSkills;
exports.skills = [
    {
        id: 'work-report-01',
        name: '工作汇报 PPT 全流程生成',
        scene: '工作汇报',
        style: '商务/工作汇报',
        language: '中文',
        price: 9.9,
        isFree: false,
        previewDesc: '模仿万元/页级 PPT 设计公司工作流，需求调研→资料搜集→大纲策划→设计稿',
        agents: ['codex', 'doubao', 'workbuddy'],
        source: 'Akxan/ppt-agent-skill',
    },
    {
        id: 'work-report-free',
        name: '基础工作汇报 PPT',
        scene: '工作汇报',
        style: '商务/工作汇报',
        language: '中文',
        price: 0,
        isFree: true,
        previewDesc: '免费导流品：基础工作汇报模板，快速生成季度/月度汇报',
        agents: ['codex', 'doubao'],
        source: 'Akxan/ppt-agent-skill',
    },
    {
        id: 'defense-01',
        name: '科研答辩 PPT 生成',
        scene: '答辩',
        style: '答辩',
        language: '中文',
        price: 9.9,
        isFree: false,
        previewDesc: '科研答辩风格，含清爽专业风/数据仪表盘风，适合毕业答辩/开题',
        agents: ['codex', 'doubao', 'workbuddy'],
        source: 'tangonho/iml-pptx',
    },
    {
        id: 'defense-free',
        name: '基础答辩 PPT',
        scene: '答辩',
        style: '答辩',
        language: '中文',
        price: 0,
        isFree: true,
        previewDesc: '免费导流品：基础答辩模板，快速生成毕业答辩 PPT',
        agents: ['codex', 'doubao'],
        source: 'tangonho/iml-pptx',
    },
    {
        id: 'academic-01',
        name: '学术论文 PPT 生成',
        scene: '学术研究',
        style: '学术',
        language: '英文',
        price: 9.9,
        isFree: false,
        previewDesc: '学术 PPT skill，含 slide_patterns + content_guidelines',
        agents: ['codex', 'doubao'],
        source: 'Gabberflast/academic-pptx-skill',
    },
    {
        id: 'thesis-defense-01',
        name: '论文答辩可编辑 PPTX',
        scene: '答辩',
        style: '答辩',
        language: '中文',
        price: 19.9,
        isFree: false,
        previewDesc: 'Codex/Claude Skill 生成可编辑论文答辩 PPTX',
        agents: ['codex', 'workbuddy'],
        source: 'zouchenzhen/thesis-defense-pptx-skill',
    },
    {
        id: 'corporate-01',
        name: '日企商务 PPT 生成',
        scene: '商务展示',
        style: '日企',
        language: '英文',
        price: 9.9,
        isFree: false,
        previewDesc: '日企风格 PPTX skill，商务正式风格',
        agents: ['codex', 'doubao', 'workbuddy'],
        source: 'gonta223/japanese-corporate-pptx-skill',
    },
    {
        id: 'corporate-deck-01',
        name: '商务汇报 Deck',
        scene: '工作汇报',
        style: '商务/工作汇报',
        language: '英文',
        price: 9.9,
        isFree: false,
        previewDesc: '企业商务 deck 生成 skill',
        agents: ['codex', 'doubao'],
        source: 'giaffa86/corporate-pptx-deck-skill',
    },
];
// 按场景筛选
function getSkillsByScene(scene) {
    if (scene === '全部')
        return exports.skills;
    return exports.skills.filter(s => s.scene === scene);
}
// 按风格筛选
function getSkillsByStyle(style) {
    return exports.skills.filter(s => s.style.includes(style));
}
// 获取免费 skill（导流品）
function getFreeSkills() {
    return exports.skills.filter(s => s.isFree);
}
