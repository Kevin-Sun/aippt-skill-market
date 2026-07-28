// pages/mine/mine.ts · 我的页面
Page({
    data: {
        isLoggedIn: false,
        userInfo: null,
        purchasedSkills: [],
        memberLevel: 'free',
    },
    onShow: function() {
        this.checkLogin();
        this.loadPurchased();
    },
    checkLogin() {
        const userInfo = wx.getStorageSync('userInfo');
        this.setData({ isLoggedIn: !!userInfo, userInfo });
    },
    loadPurchased() {
        const purchased = wx.getStorageSync('purchasedSkills') || [];
        this.setData({ purchasedSkills: purchased });
    },
    onLoginTap() {
        wx.navigateTo({ url: '/pages/login/login' });
    },
    onMemberTap() {
        wx.showToast({ title: '会员体系 E6 接入', icon: 'none' });
    },
    onCommunityTap() {
        wx.setClipboardData({
            data: '知识星球：agent+办公/学业社群（299年费）',
            success: () => wx.showToast({ title: '社群链接已复制', icon: 'success' }),
        });
    },
});
