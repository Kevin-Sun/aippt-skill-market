// pages/promotion/promotion.js · F1: 活动点击→详情页
var banners = [
  { id: 'invite', image: '/images/promotion-invite.jpg', title: '邀请好友得免费 skill', desc: '转发给好友，双方各得 1 个免费 skill', action: '立即邀请', type: 'share' },
  { id: 'member', image: '/images/promotion-member.jpg', title: '会员权益', desc: '8种风格 skill 全场景覆盖，月费 19 起', action: '开通会员', type: 'member' },
  { id: 'sale', image: '/images/promotion-sale.jpg', title: '限时特惠', desc: 'PPT skill 0.99 元限时抢', action: '抢购', type: 'sale' },
  { id: 'free', image: '/images/promotion-free.jpg', title: '免费 skill 领取', desc: '基础 skill 免费领，先到先得', action: '领取', type: 'free' },
];

Page({
  data: { banners: banners },

  onBannerTap: function(e) {
    var type = e.currentTarget.dataset.type;
    var id = e.currentTarget.dataset.id;
    switch(type) {
      case 'share':
        wx.showShareMenu({ withShareTicket: true });
        wx.showToast({ title: '点击右上角转发', icon: 'none' });
        break;
      case 'member':
        wx.navigateTo({ url: '/pages/promotion-detail/promotion-detail?id=member' });
        break;
      case 'sale':
        wx.navigateTo({ url: '/pages/promotion-detail/promotion-detail?id=sale' });
        break;
      case 'free':
        wx.navigateTo({ url: '/pages/promotion-detail/promotion-detail?id=free' });
        break;
    }
  },

  onShareAppMessage: function() {
    return {
      title: 'AI智作PPT · 免费领 PPT skill',
      path: '/pages/index/index',
      imageUrl: '/images/promotion-invite.jpg',
    };
  },
});
