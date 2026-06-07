<template>
  <div class="home-page">
    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="container">
        <!-- 博客标题区域 -->
        <div class="blog-header">
          <h2 class="blog-title">{{ $t('home.latestBlogs') }}</h2>
          <p class="blog-subtitle">{{ $t('home.blogSubtitle') }}</p>
        </div>

        <!-- 博客列表 -->
        <div class="blog-list">
          <div v-for="blog in blogList" :key="blog.id" class="blog-card">
            <div class="blog-card-header">
              <h3 class="blog-card-title">{{ $t(blog.titleKey) }}</h3>
              <span class="blog-date">{{ blog.date }}</span>
            </div>
            <p class="blog-excerpt">{{ $t(blog.excerptKey) }}</p>
            <div class="blog-card-footer">
              <span class="blog-author">{{ $t('home.author') }}: {{ blog.author }}</span>
              <button class="read-more-btn">{{ $t('home.readMore') }}</button>
            </div>
          </div>
        </div>

        <!-- 加载更多按钮 -->
        <div class="load-more-section">
          <button class="load-more-btn">{{ $t('home.loadMore') }}</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 示例博客数据（使用国际化键值）
const blogList = [
  {
    id: 1,
    titleKey: 'blog.vue3Composition',
    excerptKey: 'blog.vue3Excerpt',
    author: 'Vue团队',
    date: '2024-01-15'
  },
  {
    id: 2,
    titleKey: 'blog.frontendTools',
    excerptKey: 'blog.frontendExcerpt',
    author: '开发组',
    date: '2024-01-12'
  },
  {
    id: 3,
    titleKey: 'blog.typescriptDeepDive',
    excerptKey: 'blog.typescriptExcerpt',
    author: 'TypeScript爱好者',
    date: '2024-01-10'
  },
  {
    id: 4,
    titleKey: 'blog.responsiveDesign',
    excerptKey: 'blog.responsiveExcerpt',
    author: 'UI/UX设计师',
    date: '2024-01-08'
  },
  {
    id: 5,
    titleKey: 'blog.nodejsOptimization',
    excerptKey: 'blog.nodejsExcerpt',
    author: '后端开发',
    date: '2024-01-05'
  },
  {
    id: 6,
    titleKey: 'blog.gitWorkflow',
    excerptKey: 'blog.gitExcerpt',
    author: 'DevOps工程师',
    date: '2024-01-03'
  }
]
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 3rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.blog-header {
  text-align: center;
  margin-bottom: 3rem;
}

.blog-title {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--theme-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.blog-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.blog-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.blog-card {
  background: var(--gradient-card);
  border: var(--border-light);
  border-radius: 1rem;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(255, 255, 255, 0.2);
}

.blog-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.blog-card-title {
  font-size: 1.375rem;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  margin-right: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

.blog-date {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  font-weight: 500;
}

.blog-excerpt {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blog-author {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.load-more-section {
  text-align: center;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 0;
  }

  .container {
    padding: 0 0.75rem;
  }

  .blog-title {
    font-size: 2rem;
  }

  .blog-list {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .blog-card {
    padding: 1.25rem;
  }

  .blog-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .blog-card-title {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 1rem 0;
  }

  .container {
    padding: 0 0.5rem;
  }

  .blog-title {
    font-size: 1.75rem;
  }

  .blog-card {
    padding: 1rem;
  }

  .read-more-btn {
    align-self: flex-end;
  }
}
</style>
