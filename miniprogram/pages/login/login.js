// pages/login/login.ts · 登录页（微信一键登录）
Page({
    data: {
        agree: false,
    },
    onAgreeChange(e) {
        this.setData({ agree: e.detail.value.length > 0 });
    },
    onLoginTap() {
        if (!this.data.agree) {
            wx.showToast({ title: '请先同意用户协议', icon: 'none' });
            return;
        }
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res) => {
                wx.setStorageSync('userInfo', res.userInfo);
                wx.showToast({ title: '登录成功', icon: 'success' });
                setTimeout(() => wx.navigateBack(), 1500);
            },
            fail: () => {
                wx.showToast({ title: '登录取消', icon: 'none' });
            },
        });
    },
});
