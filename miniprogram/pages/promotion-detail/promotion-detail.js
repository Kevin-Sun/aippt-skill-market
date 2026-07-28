// pages/promotion-detail/promotion-detail.js · 活动详情页
var activities = {
  invite: {
    title: '邀请好友得免费 skill', banner: '/images/promotion-invite.png',
    rules: ['1. 转发活动给好友', '2. 好友通过你的链接注册', '3. 双方各得 1 个免费 skill', '4. 邀请上限 5 人'],
    steps: [{ step: 1, title: '转发活动', desc: '点击"立即邀请"转发给好友' }, { step: 2, title: '好友注册', desc: '好友通过你的链接注册小程序' }, { step: 3, title: '获得奖励', desc: '双方各得 1 个免费 skill' }],
    rewards: [{ name: '免费 skill x1', status: '待获得' }],
    inviteRecords: []
  },
  member: {
    title: '会员权益', banner: '/images/promotion-member.png',
    rules: ['1. 开通月度/年度会员', '2. 解锁全库 skill', '3. 月度会员含定制调优 1 次', '4. 年度会员含社群'],
    steps: [{ step: 1, title: '选择档位', desc: '2.9/9.9/19.9/99.9' }, { step: 2, title: '支付开通', desc: '微信支付' }, { step: 3, title: '享受权益', desc: '全库 skill + 定制 + 社群' }],
    rewards: [], inviteRecords: []
  },
  community: {
    title: '知识星球社群', banner: '/images/promotion-community.png',
    rules: ['1. 年费 299 元', '2. 每日更新 PPT 技巧', '3. agent 使用交流', '4. 会员专属定制调优'],
    steps: [{ step: 1, title: '扫码加入', desc: '复制知识星球链接' }, { step: 2, title: '支付年费', desc: '299 元/年' }, { step: 3, title: '加入社群', desc: '每日更新+交流' }],
    rewards: [], inviteRecords: []
  },
  sale: {
    title: '限时特惠 0.99 元', banner: '/images/promotion-sale.png',
    rules: ['1. 限时 3 天', '2. 精选 skill 0.99 元', '3. 每人限购 1 个', '4. 不支持退款'],
    steps: [{ step: 1, title: '选择 skill', desc: '从特惠列表选择' }, { step: 2, title: '支付 0.99', desc: '微信支付' }, { step: 3, title: '解锁 skill', desc: '立即使用' }],
    rewards: [], inviteRecords: []
  },
  free: {
    title: '免费 skill 领取', banner: '/images/promotion-free.png',
    rules: ['1. 每人限领 1 个', '2. 基础 skill 免费领', '3. 先到先得', '4. 领取后永久使用'],
    steps: [{ step: 1, title: '选择免费 skill', desc: '工作汇报/答辩' }, { step: 2, title: '点击领取', desc: '免费解锁' }, { step: 3, title: '开始使用', desc: '复制到 agent' }],
    rewards: [], inviteRecords: []
  }
};

Page({
  data: { activity: null, countdown: '03:00:00' },
  onLoad: function(options) {
    var id = options.id || 'invite';
    var activity = activities[id];
    this.setData({ activity: activity });
    this.startCountdown();
  },
  startCountdown: function() {
    var self = this;
    var remaining = 3 * 24 * 3600;
    setInterval(function() {
      remaining--;
      if (remaining < 0) remaining = 0;
      var d = Math.floor(remaining / 86400);
      var h = Math.floor((remaining % 86400) / 3600);
      var m = Math.floor((remaining % 3600) / 60);
      var s = remaining % 60;
      self.setData({ countdown: (d > 0 ? d + '天 ' : '') + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s });
    }, 1000);
  },
  onInviteTap: function() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '点击右上角转发', icon: 'none' });
  },
  onShareAppMessage: function() {
    return {
      title: this.data.activity.title + ' · AI智作PPT',
      path: '/pages/promotion/promotion',
      imageUrl: this.data.activity.banner
    };
  }
});
