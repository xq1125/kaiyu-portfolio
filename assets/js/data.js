/* Portfolio content — edit titles, roles and copy here. */
window.PORTFOLIO = (() => {
  const categories = [
    {
      id: "game",
      num: "01",
      title: "游戏设计",
      en: "GAME VISUAL",
      accent: "#c84a32",
      soft: "#f6e2da",
      cover: "assets/img/covers/card-game.webp",
      desc: "从暗黑幻想的世界观，到一套可以被点开的界面系统。把规则、叙事与情绪，折叠进一个可以进入的画面。",
      tags: ["Worldbuilding", "Character", "UI/UX", "Key Art", "Motion", "Launch"],
      noteTitle: "从 0 到 1",
      note: "从 0 到 1 做一套游戏视觉：世界观、角色、规则、界面、道具、宣发和 Demo，最后长成同一套语言。不是几张设定图，是一个真的可以走进去的世界。",
      plates: [
        { id: "1-1", title: "深渊恶魔：狱界破笼", role: "主视觉 / KEY ART · 2026", videos: [
          { label: "游戏 Demo", src: "assets/video/unity-demo.mp4", poster: "assets/img/video/unity-demo.webp", duration: "3:08" }
        ] },
        { id: "1-2", title: "深渊恶魔：狱界破笼", role: "世界观与游戏系统 / SYSTEM" },
        { id: "1-3", title: "深渊恶魔：狱界破笼", role: "角色图鉴与界面 / CODEX & UI" },
        { id: "1-4", title: "深渊恶魔：狱界破笼", role: "界面、道具与视觉资产 / UI & PROPS" },
        { id: "1-5", title: "东方纹章录", role: "东方幻想企划 / EASTERN FANTASY · 2026" },
        { id: "1-6", title: "东方纹章录", role: "场景与界面系统 / SCENE & UI" },
        { id: "1-7", title: "游戏视觉企划", role: "版本活动视觉 / EVENT VISUAL", videos: [
          { label: "游戏特效", src: "assets/video/game-vfx.mp4", poster: "assets/img/video/game-vfx.webp", duration: "0:11" }
        ] },
        { id: "1-8", title: "游戏视觉企划", role: "角色与宣发 / CHARACTER & KEY VISUAL" },
        { id: "1-9", title: "魔兽世界 · 直播宣发", role: "平台 Campaign Mockup / 2026" }
      ]
    },
    {
      id: "aigc",
      num: "02",
      title: "AIGC 影像",
      en: "MOVING IMAGE",
      accent: "#b37b22",
      soft: "#f7ecd1",
      cover: "assets/img/covers/card-aigc.webp",
      desc: "用生成式工具写镜头。在水墨、科幻与非遗之间搭桥，让技术退后一点，让情绪站到画面前面。",
      tags: ["AI Film", "Art Direction", "Storyboard", "Motion"],
      noteTitle: "工具动手，我来决定",
      note: "AI 工具让表达变轻，但真正让画面有重量的，是我想说的东西。它替我动手，不替我思考。",
      plates: [
        { id: "2-1", title: "山海 · 一念", role: "AI 水墨短片 / 3′20″ · 2026", videos: [
          { label: "正片", src: "assets/video/shanhai.mp4", poster: "assets/img/video/shanhai.webp", duration: "3:19" }
        ] },
        { id: "2-2", title: "山海 · 一念", role: "角色设定与制作流程 / CHARACTER & PROCESS" },
        { id: "2-3", title: "未发送", role: "A-01 记忆工程 / SCI-FI SHORT FILM", videos: [
          { label: "正片", src: "assets/video/weifasong.mp4", poster: "assets/img/video/weifasong.webp", duration: "3:17" }
        ] },
        { id: "2-4", title: "非遗系列短片", role: "剪纸 · 打铁花 · 苏绣 / DOCUMENTARY", videos: [
          { label: "剪纸", src: "assets/video/jianzhi.mp4", poster: "assets/img/video/jianzhi.webp", duration: "2:13" },
          { label: "打铁花", src: "assets/video/datiehua.mp4", poster: "assets/img/video/datiehua.webp", duration: "3:15" }
        ] },
        { id: "2-5", title: "AI 漫剧", role: "都市异能 · AI 短剧 / AI SERIES · 2026", videos: [
          { label: "正片", src: "assets/video/aimanju.mp4", poster: "assets/img/video/aimanju.webp", duration: "1:57" }
        ] }
      ]
    },
    {
      id: "uiux",
      num: "03",
      title: "UI/UX 交互",
      en: "INTERFACE",
      accent: "#3f6b52",
      soft: "#e4ede2",
      cover: "assets/img/covers/card-uiux.webp",
      desc: "让复杂系统变得清晰，让一次点击也有呼吸感。在信息密度与视觉秩序之间，寻找恰到好处的那个点。",
      tags: ["Product Design", "Design System", "Prototype", "B2B SaaS"],
      noteTitle: "界面是顺序，不是装饰",
      note: "UI 设计不是把功能铺满屏幕，而是决定用户先看到什么、下一步点哪里。我把复杂的 HR 流程，拆成一条不用解释的路径。",
      plates: [
        { id: "3-1", title: "星承 HRM SaaS", role: "产品主视觉 / UX·UI · 2026" },
        { id: "3-2", title: "星承 HRM SaaS", role: "用户画像与产品结构 / PERSONA & IA" },
        { id: "3-3", title: "星承 HRM SaaS", role: "设计规范与情绪色彩 / DESIGN SYSTEM" },
        { id: "3-4", title: "星承 HRM SaaS", role: "核心内页解析 / INTERFACE" },
        { id: "3-5", title: "星承 HRM SaaS", role: "交互演示与智能分析 / AI INTERACTION", videos: [
          { label: "交互演示", src: "assets/video/uiux-demo.mp4", poster: "assets/img/video/uiux-demo.webp", duration: "0:40" }
        ] },
        { id: "3-6", title: "星承 HRM SaaS", role: "原型推演与页面总览 / PROTOTYPE" }
      ]
    },
    {
      id: "three-d",
      num: "04",
      title: "3D 建模",
      en: "SPATIAL",
      accent: "#655d9c",
      soft: "#eae6f2",
      cover: "assets/img/covers/card-3d.webp",
      desc: "在 Blender、C4D 与 Maya 里，搭起一些柔软的、会发光的立体世界。建模、材质、灯光，一步一步把想象落地。",
      tags: ["Blender", "C4D", "Maya", "Look Dev"],
      noteTitle: "先捏一个软软的宇宙",
      note: "建模像做手工。先有一个团块，再慢慢把它捏成有表情的东西。",
      plates: [
        { id: "4-1", title: "3D 课堂练习", role: "IP 场景与产品视觉 / BLENDER · C4D · MAYA", videos: [
          { label: "课堂练习", src: "assets/video/three-d.mp4", poster: "assets/img/video/three-d.webp", duration: "0:07" }
        ] },
        { id: "4-2", title: "立体视觉实验", role: "海报 · 空间 · 建模 / SPATIAL STUDY" }
      ]
    },
    {
      id: "ip",
      num: "05",
      title: "IP 叙事造物",
      en: "WORLD BUILDING",
      accent: "#4d7b58",
      soft: "#e3eee3",
      cover: "assets/img/covers/card-ip.webp",
      desc: "从一个角色出发，长出一整套可以触摸的叙事。视觉系统、周边、包装与绘本，让故事不止停在屏幕上。",
      tags: ["IP Design", "Illustration", "Packaging", "Picture Book"],
      noteTitle: "先接住情绪，再做角色",
      note: "我把心理疗愈的思路带进 IP 与绘本：先看见孩子的情绪，再让角色去承接和陪伴。好看只是入口，能安抚人，故事才成立。",
      plates: [
        { id: "5-1", title: "森林合唱团", role: "IP 主视觉 / FOREST CHOIR · 2026" },
        { id: "5-2", title: "森林合唱团", role: "视觉系统与衍生 / SYSTEM & MERCH" },
        { id: "5-3", title: "小 X 成长记", role: "儿童心理疗愈绘本 / PICTURE BOOK" },
        { id: "5-4", title: "小 X 成长记", role: "绘本分镜 / STORYBOARD" },
        { id: "5-5", title: "风物广水 · 礼遇", role: "地域文创 IP / REGIONAL IP" },
        { id: "5-6", title: "长江文创 IP", role: "江豚角色 · 城市礼物 / CHARACTER & MERCH" }
      ]
    },
    {
      id: "lab",
      num: "06",
      title: "个人创作",
      en: "PLAY & EXPERIMENT",
      accent: "#466b86",
      soft: "#e2ebf0",
      cover: "assets/img/covers/card-lab.webp",
      desc: "不被定义的练习：分镜、动效、网页和一点点交互胡闹。比起正确答案，更想保留好奇心。",
      tags: ["Motion", "Storyboard", "Interaction", "Experiment"],
      noteTitle: "草稿里藏着最好玩的部分",
      note: "这些作品不一定“完整”，但它们都很诚实。是我在正式项目之外，自己跟自己玩的证据。",
      plates: [
        { id: "6-1", title: "动画研讨会", role: "分镜与动画练习 / STORYBOARD", videos: [
          { label: "动画作品集", src: "assets/video/animation-reel.mp4", poster: "assets/img/video/animation-reel.webp", duration: "2:00" }
        ] },
        { id: "6-2", title: "二十四节气", role: "AE 动效 · 角色三视图 / MOTION", videos: [
          { label: "AE 动效", src: "assets/video/solar-terms.mp4", poster: "assets/img/video/solar-terms.webp", duration: "1:50" }
        ] },
        { id: "6-3", title: "情绪可视化", role: "电话手表交互实验 / INTERACTION", videos: [
          { label: "交互演示", src: "assets/video/touchdesigner.mp4", poster: "assets/img/video/touchdesigner.webp", duration: "0:15" }
        ] },
        { id: "6-5", title: "黑洞便利店", role: "个人品牌网站 / WEB DESIGN · 2026", site: "https://xq1125.github.io/blackhole-mart/#community", videos: [
          { label: "网站演示", src: "assets/video/blackhole-demo.mp4", poster: "assets/img/video/blackhole-demo.webp", duration: "0:30" }
        ] },
        { id: "6-6", title: "豆季 · 手工精品咖啡", role: "咖啡品牌网站 / WEB DESIGN · 2026", site: "https://xq1125.github.io/coffee-website/", videos: [
          { label: "网站演示", src: "assets/video/coffee-demo-1.6.mp4", poster: "assets/img/video/coffee-demo.webp", duration: "0:44" }
        ] }
      ]
    }
  ];

  return {
    meta: {
      nameCn: "郑铠妤",
      nameEn: "KAIYU ZHENG",
      role: "Visual Designer / Image Maker",
      city: "Hangzhou, CN",
      email: "13554191868@163.com",
      phone: "13554191868",
      qq: "601124813",
      wechat: "xxqwsyttkx",
      year: "2026"
    },
    categories,
    facts: [
      { label: "EDUCATION", value: "湖北大学", detail: "数字媒体艺术 本科 · 2023.09—2027.06" },
      { label: "EDUCATION", value: "中央美术学院（保研）", detail: "2027.09—" },
      { label: "EXPERIENCE", value: "网易（杭州）网络有限公司", detail: "平面设计师 · 2026.07—至今" },
      { label: "EXPERIENCE", value: "深圳冰川网络股份有限公司（武汉）", detail: "AIGC 视频实习生 · 2026.04—2026.06" }
    ],
    capabilities: [
      "游戏视觉与宣发", "角色 / 场景设定", "UI · UX 设计",
      "3D 视觉与渲染", "AI 图像与视频", "IP 形象与衍生",
      "游戏特效", "动画与视频制作", "跨媒介叙事"
    ]
  };
})();
