---
title: 关于
type: links
date: 2023-11-05 23:59:57
---

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">

<style>
  /* 确保我们的样式只应用于特定的容器 */
  .wolf-about-wrapper * {
    box-sizing: border-box;
  }
  
  .wolf-about-wrapper {
    max-width: 100%;
    margin: 0 auto;
    color: var(--default-text-color);
    font-family: var(--font-family);
  }
  
  .wolf-about-wrapper h2 {
    margin-top: 1.5rem;
    border-bottom: none;
  }
  
  .wolf-about-wrapper img {
    max-width: 100%;
    height: auto;
  }
  
  /* 卡片样式 */
  .wolf-card {
    background: var(--second-background-color);
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .wolf-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
  
  /* 狼爪印装饰 */
  .paw-divider {
    text-align: center;
    margin: 30px 0;
    position: relative;
    height: 30px;
  }
  
  .paw-divider::before {
    content: "🐾";
    font-size: 2em;
    color: #3f871e;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  
  /* 头部样式 */
  .wolf-header {
    position: relative;
    padding-top: 20px;
    margin-bottom: 40px;
    text-align: center;
  }
  
  .profile-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid #3f871e;
    object-fit: cover;
    margin: 0 auto 15px;
    display: block;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }
  
  /* 技能条样式 */
  .skill-container {
    margin-bottom: 15px;
  }
  
  .skill-name {
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
  }
  
  .skill-bar {
    height: 10px;
    background: var(--border-color);
    border-radius: 5px;
    overflow: hidden;
  }
  
  .skill-progress {
    height: 100%;
    background: linear-gradient(to right, #3f871e, #56597b);
    border-radius: 5px;
    width: 0;
    transition: width 1.5s ease;
  }
  
  /* 时间轴样式 */
  .wolf-timeline {
    position: relative;
    padding-left: 30px;
    margin-top: 30px;
  }
  
  .wolf-timeline::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 2px;
    background: linear-gradient(to bottom, #3f871e, #56597b);
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 25px;
  }
  
  .timeline-dot {
    position: absolute;
    left: -39px;
    top: 5px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3f871e;
    box-shadow: 0 0 0 4px rgba(63, 135, 30, 0.2);
  }
  
  /* 兴趣标签 */
  .interests {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }
  
  .interest-tag {
    background: rgba(63, 135, 30, 0.1);
    color: var(--default-text-color);
    padding: 8px 15px;
    border-radius: 20px;
    border: 1px solid rgba(63, 135, 30, 0.3);
    transition: all 0.3s ease;
  }
  
  .interest-tag:hover {
    background: rgba(63, 135, 30, 0.2);
    transform: translateY(-3px);
  }
  
  /* 引用样式 */
  .wolf-quote {
    border-left: 4px solid #3f871e;
    padding: 15px;
    background: var(--third-background-color);
    margin: 20px 0;
    font-style: italic;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    .wolf-card {
      padding: 20px;
    }
    
    .profile-image {
      width: 100px;
      height: 100px;
    }
  }
</style>

<div class="wolf-about-wrapper">
  <div class="wolf-header">
    <img src="/img/关于/wolf.JPG" class="profile-image" alt="Wolf Avatar">
    <h1>雲之残骸，Wreckloud（维克罗德）</h1>
    <p>🐺 狼癌晚期患者 | 游戏爱好者 | 编程学习者</p>
  </div>
  
  <div class="wolf-card">
    <h2>🐺 关于我</h2>
    <p>你好！我是<strong>雲之残骸，Wreckloud（维克罗德）</strong></p>
    <p>中文名字的来源是当时我很喜欢的一个角色，他的名字叫骸雲。并没有什么特别的地方，仅此而已。</p>
    <p>英文名字是由于自己的英语水平换了一次又一次。。其实也没有什么特别的，仅仅是残骸wreckage + 云cloud 的组合罢了。</p>
    <p>就目前来看，我倒是不觉得我自己有什么值得写的呢……就是标准的死宅。简单概括自己就是：<strong>啥都不会又没人要</strong></p>
    <p>有点悲观？我自己倒觉得不是，毕竟不会才要去学嘛。关于没人要这点……呜呜，我也想来一场甜甜的恋爱啊可恶。不过一见钟情的全都在另一个次元 <del>（宅狼落泪）</del>。</p>
    <p>再反观现实，看看自己的状况，再看看这"盛世"！只能哀叹啊……我只能将心中这份情感留给另一个次元吧……</p>
  </div>

  <div class="paw-divider"></div>
  
  <div class="wolf-card">
    <h2>🌟 我的梦想</h2>
    <p>不过人总要有点梦想的嘛……</p>
    <p>小学最喜欢玩的是Minecraft我的世界。当初应该也是第一次接触三维游戏，因为那时候觉得MC太好玩了，晕3D也还不停（然后就治好了我的晕3D）。一直到中学，我都很喜欢方块人。很荣幸能通过mc认识了一堆很有意思的方块人，到现在也有依旧聊得开的。</p>
    <p>当我第一次接触到指令方块的时候，就下定决心要学习计算机，制作一款自己的游戏。最终，我转专业到了计科班。嘛，这个梦想现在也算勉强完成了一半吧！</p>
    <p>今后，不期望自己能够在游戏行业工作。但也希望自己能够保持初心，看清生活，热爱生活吧！</p>
    <p>要制作独立游戏，剧情、音乐、美术、编程，我都得去涉及啊。因此，我把它当作我的人生终极目标。刚从中学出来的我，真是啥也不会啊，小学就非常羡慕父母给报兴趣班的。不过，现在！能自由安排自己想学什么了，终于！</p>
    <p>我要好好把握自己在大学的时光！</p>
  </div>
  
  <div class="wolf-card">
    <h2>⚡ 我的技能</h2>
    <div class="skill-container">
      <div class="skill-name">
        <span>编程</span>
        <span>40%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-progress" data-width="40%"></div>
      </div>
    </div>
    
    <div class="skill-container">
      <div class="skill-name">
        <span>游戏设计</span>
        <span>60%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-progress" data-width="60%"></div>
      </div>
    </div>
    
    <div class="skill-container">
      <div class="skill-name">
        <span>捕捉月光</span>
        <span>90%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-progress" data-width="90%"></div>
      </div>
    </div>
    
    <div class="skill-container">
      <div class="skill-name">
        <span>狼嗥</span>
        <span>100%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-progress" data-width="100%"></div>
      </div>
    </div>
  </div>
  
  <div class="paw-divider"></div>
  
  <div class="wolf-card">
    <h2>🌈 关于博客</h2>
    <p>初衷是用来存放自己一些杂七杂八的东西。<del>简单来说就是一个用来装的QQ空间</del></p>
    <p>还有一个动机就是这学期刚好正在学习web基础，想着自己web功力到了，要做一个属于自己的网站！</p>
    <p>不过目前为止，这个博客的搭建几乎都是使用其他大佬现成的框架来搭建的，我做的仅仅只是"下载、安装"。（打开大佬框架中的源代码真是看不懂一点啊！）不过嘛，当初那个"制作一个属于自己的网站"目标，也算是大成功吧！</p>
    <p>有了现在这个博客，写笔记那是更有干劲了！</p>
    
    <h3>关于为什么非得是狼</h3>
    <p>我是狼癌晚期！狼是地球上最帅最美丽的生物！（拒绝一切反驳！</p>
    
    <div class="wolf-quote">
      <p>狼不畏惧黑暗，<br>
      狼不屈服命运，<br>
      狼不随波逐流，<br>
      狼只追随本性和梦想。</p>
    </div>
    
    <p>不知道自己会不会是叶公好龙，不过这点已经无所谓了。</p>
    <p>狼在我心目中已经是我对一切美好的具象化。<del>（狼癌晚期，并制止了自己开始发癫</del></p>
  </div>
  
  <div class="wolf-card">
    <h2>⏳ 我的历程</h2>
    <div class="wolf-timeline">
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <h3>现在</h3>
        <p>继续在计算机科学的道路上探索</p>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <h3>大学</h3>
        <p>转专业到计算机科学，开始追逐游戏开发梦想</p>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <h3>中学</h3>
        <p>继续沉迷Minecraft，结识了一群志同道合的朋友</p>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <h3>小学</h3>
        <p>第一次接触Minecraft，开始对游戏和编程产生兴趣</p>
      </div>
    </div>
  </div>
  
  <div class="wolf-card">
    <h2>💖 我的兴趣爱好</h2>
    <div class="interests">
      <span class="interest-tag">狼</span>
      <span class="interest-tag">Minecraft</span>
      <span class="interest-tag">游戏开发</span>
      <span class="interest-tag">编程</span>
      <span class="interest-tag">动漫</span>
      <span class="interest-tag">电子游戏</span>
    </div>
    
    <div style="margin-top:30px; text-align:center;">
      <p>还有什么要说的嘛……以后想到再说吧！就先这样，感谢能看到这行的你！</p>
      <a href="https://space.bilibili.com/177822535?spm_id_from=333.1007.0.0" target="_blank" style="color:#3f871e; text-decoration:none; border-bottom:1px dashed #3f871e;">我的b站主页</a>
      <p style="margin-top:20px; font-style:italic; opacity:0.8;">记于 2023年10月7日</p>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // 延迟执行，确保DOM完全加载
  setTimeout(function() {
    // 技能条动画
    document.querySelectorAll('.skill-progress').forEach(function(progress) {
      var width = progress.getAttribute('data-width');
      progress.style.width = width;
    });
    
    // 添加入场动画
    let cards = document.querySelectorAll('.wolf-card');
    for(let i = 0; i < cards.length; i++) {
      let card = cards[i];
      card.classList.add('animate__animated', 'animate__fadeInUp');
      card.style.animationDelay = (i * 0.2) + 's';
      card.style.opacity = 0;
      setTimeout(function() {
        card.style.opacity = 1;
      }, i * 200);
    }
  }, 500);
});
</script>
