<template>
  <div class="greeting-container">
    <div class="greeting-box">
      <span class="greeting-text">嗨 你好呀!</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Greeting'
}
</script>

<style scoped>
.greeting-container {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
}

.greeting-box {
  background: linear-gradient(135deg, rgba(10, 62, 30, 0.1) 0%, rgba(10, 62, 30, 0.3) 100%);
  border: 2px solid rgba(10, 62, 30, 0.2);
  border-radius: 1px;
  padding: 2rem 6.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  transform: perspective(800px) rotateX(2deg);
  transition: all 0.3s ease;
}

.greeting-box:hover {
  transform: perspective(800px) rotateX(0);
  padding: 4rem 13rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

.greeting-text {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--vp-c-brand-1, #0023c0);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: block;
}

@media (max-width: 768px) {
  .greeting-box {
    padding: 1rem 2rem;
  }
  
  .greeting-text {
    font-size: 2rem;
  }
}
</style> 