// 知乎句子收藏夹 - 内容脚本
// 尝试从知乎页面提取作者信息（识别不到则留空）

(function () {
  'use strict';

  /**
   * 尝试从页面提取作者名
   * 知乎的作者信息通常在以下位置：
   * 1. 文章作者：.AuthorInfo 中的姓名
   * 2. 回答作者：.AuthorInfo 中的姓名
   * 3. meta 标签中的 author
   * 4. 用户头像旁的作者名
   * 注意：不保证能稳定识别，识别不到就返回空字符串，不猜测
   */
  function extractAuthor() {
    try {
      // 知乎标准作者元素（新版知乎）
      const authorEl = document.querySelector(
        '.AuthorInfo-name, .AuthorInfo .name, .QuestionAnswerAuthor .AuthorInfo-name'
      );
      if (authorEl && authorEl.textContent.trim()) {
        return authorEl.textContent.trim();
      }

      // 旧版知乎
      const metaAuthor = document.querySelector('meta[name="author"]');
      if (metaAuthor && metaAuthor.content) {
        return metaAuthor.content.trim();
      }

      // 回答页面的作者（可能出现在回答头部）
      const answerAuthor = document.querySelector(
        '.AnswerItem .AuthorInfo-name, [itemprop="author"] [itemprop="name"]'
      );
      if (answerAuthor && answerAuthor.textContent.trim()) {
        return answerAuthor.textContent.trim();
      }

      // 作者卡片浮层
      const authorCard = document.querySelector('.AuthorCard-name');
      if (authorCard && authorCard.textContent.trim()) {
        return authorCard.textContent.trim();
      }
    } catch (e) {
      // 任何提取失败都返回空字符串
    }

    return '';
  }

  /**
   * 生成一个随机 UUID（用于本次会话的唯一标识）
   */
  function generateTempId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // 页面加载完成后尝试提取作者
  // 注意：我们不知道用户何时会收藏，所以持续监听 DOM 变化
  let lastAuthor = '';
  let authorPollingTimer = null;

  function pollAuthor() {
    const author = extractAuthor();
    if (author && author !== lastAuthor) {
      lastAuthor = author;
      // 可以将作者存入页面 sessionStorage，供 background.js 参考
      try {
        sessionStorage.setItem('_zhihu_author_', author);
      } catch (e) {}
    }
  }

  // 立即尝试一次，然后每 2 秒再试（最多 30 秒）
  pollAuthor();
  let pollCount = 0;
  authorPollingTimer = setInterval(() => {
    pollAuthor();
    pollCount++;
    if (pollCount >= 15) {
      clearInterval(authorPollingTimer);
    }
  }, 2000);

  // 清理计时器
  window.addEventListener('beforeunload', () => {
    if (authorPollingTimer) clearInterval(authorPollingTimer);
  });

  // 监听来自 background 的消息（用于更新作者）
  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'UPDATE_AUTHOR') {
      // content script 收到更新作者的通知（这里不需要特别处理）
      sendResponse({ success: true });
      return true;
    }
    return false;
  });
})();
