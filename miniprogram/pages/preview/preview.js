Page({
    data: {
        skillId: '',
        renderReady: false,
    },
    onLoad: function(options) {
        this.setData({ skillId: options.id || '' });
    },
    onRender: function() {
        this.setData({ renderReady: true });
    },
});
