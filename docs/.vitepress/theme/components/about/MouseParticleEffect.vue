<template>
  <canvas
    ref="canvas"
    class="particle-canvas"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import anime from 'animejs'

interface LegacyNavigator extends Navigator {
  msMaxTouchPoints?: number
}

type PointerEventLike = MouseEvent | TouchEvent
type CanvasParticle = {
  x: number
  y: number
  vx?: number
  vy?: number
  size?: number
  color: string
  alpha: number
  rotation?: number
  rotationSpeed?: number
  radius: number
  lineWidth?: number
  endPos?: { x: number; y: number }
  draw: () => void
}

const canvas = ref<HTMLCanvasElement | null>(null)
let handleTap: (e: PointerEventLike) => void = () => {}
let setCanvasSize: () => void = () => {}
let resizeObserver: ResizeObserver | null = null
let animateParticulesFn: (x: number, y: number) => void = () => {}
let createRandomCircleAnimationFn: (x: number, y: number) => void = () => {}

function getClientPoint(event: PointerEventLike): { x: number; y: number } | null {
  if ('touches' in event) {
    const touch = event.touches[0]
    if (!touch) return null
    return { x: touch.clientX, y: touch.clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

// 暴露方法给父组件
const triggerEffect = (x: number, y: number): void => {
  if (!canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect();
  const pointerX = x - rect.left;
  const pointerY = y - rect.top;
  
  // 创建粒子效果
  animateParticulesFn(pointerX, pointerY);
  createRandomCircleAnimationFn(pointerX, pointerY);
};

// 暴露给父组件的方法
defineExpose({
  triggerEffect
});

onMounted(() => {
  const canvasEl = canvas.value;
  if (!canvasEl) return
  const canvasNode: HTMLCanvasElement = canvasEl
  const context = canvasNode.getContext("2d");
  if (!context) return
  const ctx = context
  let numberOfParticules = 20;
  let pointerX = 0;
  let pointerY = 0;
  const tap = "ontouchstart" in window || (navigator as LegacyNavigator).msMaxTouchPoints
    ? "touchstart"
    : "mousedown";
  const colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"];
  
  // 存储所有活跃的粒子
  const activeParticles: CanvasParticle[] = [];
  const activeCircles: CanvasParticle[] = [];

  // 设置画布大小以适应容器
  setCanvasSize = function() {
    const container = canvasNode.parentElement;
    if (!container) return;
    
    // 设置canvas尺寸为容器的实际尺寸
    canvasNode.width = container.offsetWidth;
    canvasNode.height = container.offsetHeight;
    
    // 设置canvas样式尺寸
    canvasNode.style.width = container.offsetWidth + "px";
    canvasNode.style.height = container.offsetHeight + "px";
  };

  // 更新鼠标或触摸点的坐标
  function updateCoords(e: PointerEventLike) {
    const rect = canvasNode.getBoundingClientRect();
    const point = getClientPoint(e)
    if (!point) return
    pointerX = point.x - rect.left
    pointerY = point.y - rect.top
  }

  // 设置粒子的运动方向
  function setParticuleDirection(p: { x: number; y: number }) {
    const angle = (anime.random(0, 360) * Math.PI) / 180;
    const value = anime.random(20, 90);
    const radius = [-1, 1][anime.random(0, 1)] * value;
    return {
      x: p.x + radius * Math.cos(angle),
      y: p.y + radius * Math.sin(angle),
    };
  }

  // 创建粒子对象
  function createParticule(x: number, y: number): CanvasParticle {
    const p = {} as CanvasParticle;
    p.x = x;
    p.y = y;
    p.color = colors[anime.random(0, colors.length - 1)];
    // 随机粒子大小，控制在当前大小的0.8-2倍
    const sizeMultiplier = anime.random(80, 200) / 100; // 0.8到2.0之间的随机乘数
    p.radius = anime.random(8, 16) * sizeMultiplier;
    p.endPos = setParticuleDirection(p);
    p.alpha = 1; // 添加透明度属性
    p.draw = function () {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    
    return p;
  }

  // 创建圆形对象
  function createCircle(x: number, y: number): CanvasParticle {
    const p = {} as CanvasParticle;
    p.x = x;
    p.y = y;
    p.color = "#FFF";
    p.radius = 0.1;
    p.alpha = 0.5;
    p.lineWidth = 6;
    p.draw = function () {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
      ctx.lineWidth = p.lineWidth ?? 0;
      ctx.strokeStyle = p.color;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    return p;
  }

  // 渲染粒子
  function renderParticule(anim: { animatables: ReadonlyArray<{ target: unknown }> }) {
    for (let i = 0; i < anim.animatables.length; i++) {
      const target = anim.animatables[i].target
      if (target && typeof target === 'object' && 'draw' in target) {
        const drawable = target as CanvasParticle
        drawable.draw()
      }
    }
  }

  // 动画粒子
  animateParticulesFn = function(x: number, y: number) {
    const circle = createCircle(x, y);
    activeCircles.push(circle);
    
    const particules = [];
    for (let i = 0; i < numberOfParticules; i++) {
      const particle = createParticule(x, y);
      particules.push(particle);
      activeParticles.push(particle);
    }
    
    anime
      .timeline()
      .add({
        targets: particules,
        x: function (p: CanvasParticle) {
          return p.endPos?.x ?? p.x;
        },
        y: function (p: CanvasParticle) {
          return p.endPos?.y ?? p.y;
        },
        radius: 2, // 设置为较小的固定值
        duration: anime.random(1200, 1800),
        easing: "easeOutExpo",
        update: renderParticule
      })
      .add({
        targets: circle,
        radius: anime.random(80, 160),
        lineWidth: 0,
        alpha: {
          value: 0,
          easing: "linear",
          duration: anime.random(600, 800),
        },
        duration: anime.random(1200, 1800),
        easing: "easeOutExpo",
        update: renderParticule,
        offset: 0,
        complete: function() {
          // 圆圈动画完成后，从活跃数组中移除
          const index = activeCircles.indexOf(circle);
          if (index > -1) {
            activeCircles.splice(index, 1);
          }
        }
      });
      
    // 为每个粒子添加10秒的渐变消失效果
    particules.forEach(particle => {
      // 为每个粒子添加随机的消失时间，范围在5-15秒之间
      const disappearDelay = anime.random(5000, 15000); // 5-15秒的随机延迟
      const fadeOutDuration = anime.random(2000, 4000); // 2-4秒的随机消失时长
      
      window.setTimeout(() => {
        anime({
          targets: particle,
          alpha: 0, // 透明度降为0
          radius: particle.radius, // 保持原始尺寸，不再缩小
          duration: fadeOutDuration,
          easing: 'easeOutExpo',
          update: renderParticule,
          complete: function() {
            // 动画完成后，从活跃数组中移除粒子
            const index = activeParticles.indexOf(particle);
            if (index > -1) {
              activeParticles.splice(index, 1);
            }
          }
        });
      }, disappearDelay); // 随机延迟后开始消失动画
    });
  };

  // 创建随机圆形动画
  createRandomCircleAnimationFn = function(x: number, y: number) {
    const randomSize = anime.random(50, 90);
    const randomColor = colors[anime.random(0, colors.length - 1)];

    const circle = {
      x: x,
      y: y,
      radius: 0,
      color: randomColor,
      alpha: 1,
      draw: function () {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      },
    };
    
    activeCircles.push(circle);

    anime({
      targets: circle,
      radius: randomSize,
      alpha: 0,
      duration: 1000,
      easing: "easeOutExpo",
      update: function () {
        circle.draw();
      },
      complete: function() {
        // 圆圈动画完成后，从活跃数组中移除
        const index = activeCircles.indexOf(circle);
        if (index > -1) {
          activeCircles.splice(index, 1);
        }
      }
    });
  };

  // 渲染动画
  function renderLoop() {
    ctx.clearRect(0, 0, canvasNode.width, canvasNode.height);
    
    // 绘制所有活跃的粒子
    for (let i = 0; i < activeParticles.length; i++) {
      activeParticles[i].draw();
    }
    
    // 绘制所有活跃的圆圈
    for (let i = 0; i < activeCircles.length; i++) {
      activeCircles[i].draw();
    }
    
    requestAnimationFrame(renderLoop);
  }
  
  // 启动渲染循环
  renderLoop();

  // 处理点击事件
  handleTap = function(e: PointerEventLike) {
    updateCoords(e);
    animateParticulesFn(pointerX, pointerY);
    createRandomCircleAnimationFn(pointerX, pointerY);
  };

  // 添加事件监听
  canvasNode.addEventListener(tap, handleTap, false);

  // 初始化尺寸
  setCanvasSize();
  
  // 使用ResizeObserver监听容器大小变化
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      setCanvasSize();
    });
    
    if (canvasNode.parentElement) {
      resizeObserver.observe(canvasNode.parentElement);
    }
  } else {
    // 回退到window resize事件
    window.addEventListener("resize", setCanvasSize, false);
  }
  
  // 确保在DOM更新后重新计算尺寸
  nextTick(() => {
    setCanvasSize();
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  } else if (typeof window !== 'undefined') {
    window.removeEventListener("resize", setCanvasSize);
  }
  
  if (canvas.value) {
    const tap = "ontouchstart" in window || (navigator as LegacyNavigator).msMaxTouchPoints
      ? "touchstart"
      : "mousedown";
    canvas.value.removeEventListener(tap, handleTap as EventListener)
  }
});
</script>

<style scoped>
.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 10;
}
</style> 
