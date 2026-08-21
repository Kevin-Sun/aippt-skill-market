var skillsService = require('../../data/skills-service.js');

Page({
  data: {
    messages: [],
    inputText: '',
    skillId: '',
    skillName: '',
    isGenerating: false,
    sessionId: '',
    pptxFileID: '',
    usageUsed: 0,
    usageLimit: 0,
  },

  onLoad: function(options) {
    var skillId = options.id || '';
    var skill = skillId ? skillsService.getById(skillId) : null;
    this.setData({
      skillId: skillId,
      skillName: skill ? (skill.displayName || skill.nameZh || skill.name) : 'AI 生成',
      messages: [{ role: 'system', text: '你好！告诉我你想做什么 PPT，比如「做一份季度工作汇报」' }],
    });
    this.loadUsage();
  },

  loadUsage: function() {
    var self = this;
    wx.cloud.callFunction({
      name: 'skills',
      data: { action: 'getUsage' },
      success: function(res) {
        if (res && res.result && res.result.errno === 0) {
          self.setData({ usageUsed: res.result.used, usageLimit: res.result.limit });
        }
      },
    });
  },

  onInput: function(e) {
    this.setData({ inputText: e.detail.value });
  },

  onSend: function() {
    var text = this.data.inputText.trim();
    if (!text || this.data.isGenerating) return;
    if (this.data.usageLimit === 0) {
      wx.showModal({
        title: '需要会员',
        content: 'AI 生成 PPT 需要开通会员（月度 ¥19 / 年度 ¥99）',
        confirmText: '去开通',
        success: function(res) { if (res.confirm) wx.navigateTo({ url: '/pages/member/member' }); },
      });
      return;
    }
    if (this.data.usageUsed >= this.data.usageLimit) {
      wx.showToast({ title: '本月生成次数已用完', icon: 'none' });
      return;
    }

    var messages = this.data.messages.concat([{ role: 'user', text: text }]);
    this.setData({ messages: messages, inputText: '', isGenerating: true });

    var self = this;
    var isRefine = this.data.sessionId ? true : false;

    wx.cloud.callFunction({
      name: 'skills',
      data: {
        action: isRefine ? 'refinePPT' : 'generatePPT',
        data: {
          skillId: this.data.skillId || 'test',
          userMessage: text,
          style: '商务简约',
          pages: 5,
          sessionId: this.data.sessionId,
          instruction: text,
        },
      },
      success: function(res) {
        self.setData({ isGenerating: false });
        var result = res && res.result;
        if (result && result.errno === 0) {
          if (result.fileID) {
            self.setData({
              sessionId: result.sessionId || self.data.sessionId,
              pptxFileID: result.fileID,
            });
            self.setData({
              messages: self.data.messages.concat([
                { role: 'assistant', text: 'PPT 已生成！点击下方按钮查看 .pptx 文件。' },
                { role: 'system', text: '你可以继续说「第 3 页换成柱状图」来局部修改' },
              ]),
            });
          } else if (result.content) {
            // 解析 GLM 返回的 JSON（可能带 ```json 包裹）
            var content = result.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            var display = content;
            try {
              var parsed = JSON.parse(content);
              display = parsed.title + '\n' + (parsed.points || []).join('\n');
            } catch (e) {}
            self.setData({
              messages: self.data.messages.concat([
                { role: 'assistant', text: '修改完成：\n' + display },
              ]),
            });
          }
          self.loadUsage();
        } else {
          var errMsg = (result && result.errMsg) || '生成失败';
          if (result && result.errno === 403) {
            errMsg = '本月生成次数已用完';
          }
          self.setData({ messages: self.data.messages.concat([{ role: 'assistant', text: '出错：' + errMsg }]) });
        }
      },
      fail: function(err) {
        self.setData({ isGenerating: false });
        self.setData({ messages: self.data.messages.concat([{ role: 'assistant', text: '网络错误，请重试' }]) });
      },
    });
  },

  onDownload: function() {
    if (this.data.pptxFileID) {
      wx.cloud.downloadFile({ fileID: this.data.pptxFileID,
        success: function(res) {
          wx.openDocument({ filePath: res.tempFilePath, fileType: 'pptx', showMenu: true });
        },
        fail: function() { wx.showToast({ title: '下载失败', icon: 'none' }); },
      });
    }
  },
});
