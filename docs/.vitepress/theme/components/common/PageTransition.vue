<script>
import { onMounted, ref, defineComponent } from 'vue';
import anime from 'animejs';

export default defineComponent({
  name: 'PageTransition',
  setup() {
    const transitionRoot = ref(null);

    // 在组件挂载完成后应用动画
    onMounted(() => {
      if (!transitionRoot.value) return;
      
      // 获取所有需要动画的子元素
      const elements = transitionRoot.value.querySelectorAll('*:not(script):not(style)');
      
      // 设置初始状态
      anime.set(elements, {
        opacity: 0,
        translateY: 20, // 元素初始位置向下偏移
        duration: 0
      });
      
      // 应用动画，让元素逐个上浮出现
      anime({
        targets: elements,
        opacity: 1,
        translateY: 0,
        duration: 800,
        easing: 'easeOutCubic',
        delay: anime.stagger(100, { start: 300 }) // 每个元素错开100ms开始动画，整体延迟300ms开始
      });
    });

    return {
      transitionRoot
    };
  }
});
</script>

<template>
  <div ref="transitionRoot" class="fade-in-up-container">
    <slot></slot>
  </div>
</template>

<style scoped>
.fade-in-up-container {
  width: 100%;
}
</style> 