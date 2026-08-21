// pages/promotion-detail/promotion-detail.js · F5+F6: 图片路径+id加载
var ACTIVITIES = {
  invite: {
    id: 'invite', title: '邀请好友得免费 skill',
    description: '邀请好友注册小程序，好友首次购买 skill 后，你和好友各得 1 个免费 skill 兑换券。',
    image: '/images/promotion-invite.jpg',
    isHot: true, daysLeft: 15, participants: 1286,
    rules: ['邀请好友通过你的专属链接注册小程序','好友需首次购买任意 skill（免费 skill 不算）','你和好友各获得 1 张免费 skill 兑换券','兑换券有效期 30 天','每个用户最多邀请 50 人'],
    steps: [{num:1,title:'分享活动',desc:'点击下方分享按钮，发送给好友'},{num:2,title:'好友注册',desc:'好友通过你的链接注册小程序'},{num:3,title:'好友购买',desc:'好友首次购买任意 skill'},{num:4,title:'领取奖励',desc:'你和好友各得 1 张兑换券'}],
    rewards: [{level:'1人',name:'免费 skill x1',condition:'邀请 1 人购买'},{level:'5人',name:'免费 skill x5',condition:'邀请 5 人购买'},{level:'20人',name:'月度会员',condition:'邀请 20 人购买'},{level:'50人',name:'年度会员',condition:'邀请 50 人购买'}],
  },
  member: {
    id: 'member', title: '会员权益',
    description: '8 种风格 skill 全场景覆盖，月费 19 起，年度 99 更值。',
    image: '/images/promotion-member.jpg',
    isHot: false, daysLeft: 0, participants: 892,
    rules: ['月度会员 19 元/月','年度会员 99 元/年','全库 skill 免费使用','预览+导出功能','每月上新 skill'],
    steps: [{num:1,title:'选择套餐',desc:'选择月度或年度会员'},{num:2,title:'支付',desc:'微信虚拟支付'},{num:3,title:'开通',desc:'立即开通全库权限'}],
    rewards: [{level:'月度',name:'全库 skill',condition:'19 元/月'},{level:'年度',name:'全库+定制',condition:'99 元/年'}],
  },
  sale: {
    id: 'sale', title: '限时特惠 0.99 元',
    description: '精选 PPT skill 限时 0.99 元抢购，倒计时 3 天。',
    image: '/images/promotion-sale.jpg',
    isHot: true, daysLeft: 3, participants: 2341,
    rules: ['限时 3 天','精选 skill 0.99 元','每人限购 3 个','先到先得'],
    steps: [{num:1,title:'选 skill',desc:'选择限时特惠 skill'},{num:2,title:'支付',desc:'0.99 元抢购'},{num:3,title:'使用',desc:'立即解锁使用'}],
    rewards: [{level:'特惠',name:'精选 skill x3',condition:'0.99 元/个'}],
  },
  free: {
    id: 'free', title: '免费 skill 领取',
    description: '基础 skill 免费领，先到先得。',
    image: '/images/promotion-free.jpg',
    isHot: false, daysLeft: 0, participants: 5678,
    rules: ['基础 skill 免费领','每人限领 2 个','先到先得'],
    steps: [{num:1,title:'选 skill',desc:'选择免费 skill'},{num:2,title:'领取',desc:'免费领取'},{num:3,title:'使用',desc:'立即使用'}],
    rewards: [{level:'免费',name:'基础 skill x2',condition:'免费领取'}],
  },
};

Page({
  data: {
    activity: ACTIVITIES.invite,
    inviteCount: 0, rewardCount: 0, pendingCount: 0,
    inviteList: [],
  },

  onLoad: function(opts) {
    var id = opts && opts.id ? opts.id : 'invite';
    var activity = ACTIVITIES[id] || ACTIVITIES.invite;
    this.setData({ activity: activity });
    
    // 加载邀请记录（从 storage）
    try {
      var records = wx.getStorageSync('inviteRecords') || [];
      var completed = records.filter(function(r) { return r.status === '已完成'; });
      var pending = records.filter(function(r) { return r.status === '待结算'; });
      this.setData({
        inviteList: records,
        inviteCount: records.length,
        rewardCount: completed.length,
        pendingCount: pending.length,
      });
    } catch (e) {}
  },

  onShareTap: function() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '请点右上角分享', icon: 'none' });
  },

  onJoinTap: function() {
    // F: 保存参与状态到 storage
    try {
      var joined = wx.getStorageSync('joinedActivities') || [];
      var actId = this.data.activity.id;
      if (joined.indexOf(actId) < 0) {
        joined.push(actId);
        wx.setStorageSync('joinedActivities', joined);
      }
      wx.showToast({ title: '已参与活动', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '已参与活动', icon: 'success' });
    }
  },

  onShareAppMessage: function() {
    return {
      title: 'AI智作PPT模版社 · ' + this.data.activity.title,
      path: '/pages/promotion-detail/promotion-detail?id=' + this.data.activity.id,
    };
  },
});
