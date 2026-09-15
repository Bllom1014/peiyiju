/* ============================================================
   配一句 · AI 发圈助手（H5）
   接口约定见《配一句-开发交付文档》第七节
   ------------------------------------------------------------
   正式对外时把 USE_PROXY 改成 true 并填 PROXY_URL（云函数），
   /api/generate 与 /api/library 的全部逻辑即可迁到服务端，
   前端只保留 api* 这几个函数不变。
   ============================================================ */
const USE_PROXY = false;
const PROXY_URL = '';

const LS_LIB   = 'pjy_lib';
const LS_CFG   = 'pjy_cfg';
const LS_STAT  = 'pjy_stat';
const LS_SQ    = 'pjy_square';
const LS_SINCE = 'pjy_since';

/* ---------- 常量：与交付文档一致 ---------- */
const PLATFORMS = [
  { id:'moments',     name:'朋友圈' },
  { id:'douyin',      name:'抖音' },
  { id:'xiaohongshu', name:'小红书' }
];
const STYLE_LIST = ['忧郁','抽象','文艺','歌词','治愈','简短'];
const IMAGE_STYLES = ['忧郁','歌词','简短'];

const PLATFORM_TONE = {
  moments:     '像跟熟人随口说一句，真实、克制，不要营销腔。1 到 2 句。',
  douyin:      '前 8 个字就是钩子，节奏快、口语化，适合当视频文案。结尾加 2 到 3 个话题标签。',
  xiaohongshu: '要有标题感，可以分段换行制造节奏，结尾带 3 到 5 个话题标签。'
};

const QUICK = ['周末去露营','加班到十点','和好久不见的朋友吃饭','一个人看电影',
               '今天心情一般','刚剪了头发','带娃出门','下班路上的晚霞'];
const SCENES = ['日常','旅行','美食','工作','心情','朋友','夜色','周末'];

const PRESETS = {
  deepseek:{ base:'https://api.deepseek.com/v1',          model:'deepseek-chat',    vision:'' },
  zhipu:   { base:'https://open.bigmodel.cn/api/paas/v4', model:'glm-4.5-flash',    vision:'glm-4v-flash' },
  openai:  { base:'https://api.openai.com/v1',            model:'gpt-4o-mini',      vision:'gpt-4o-mini' },
  custom:  { base:'', model:'', vision:'' }
};

/* ============ 金句种子库（无 Key 时的兜底，也是产品调性基线）============
   lines 顺序对应 STYLE_LIST：忧郁 / 抽象 / 文艺 / 治愈 / 简短
   全部为原创仿写：参考的是网感与句式套路，不含搬运 */
const FALLBACK_TAGS = ['日常','生活碎片'];
const FALLBACK_SCENES = [
  { name:'露营户外', kw:['露营','帐篷','爬山','徒步','野餐','山','海边','公园','户外','钓鱼'],
    tags:['户外','周末'],
    lines:['篝火烧到后半夜，大家都不说话了，火光替我们热闹。',
           '花两千块买帐篷，就为了在户外刷手机。',
           '风把帐篷吹得鼓起来，像有人在外面轻轻呼吸。',
           '山把晚风递过来，我们都接住了。',
           '天亮之前，山会把今天的烦恼都收走。',
           '火灭了，话也没了。'] },
  { name:'加班工作', kw:['加班','上班','工作','开会','老板','下班','deadline','项目','工位','公司'],
    tags:['工作','日常'],
    lines:['楼下的灯一盏盏灭掉，最后那盏是我的。',
           '老板说公司是个家，我收拾东西准备搬进去住。',
           '电梯镜子里那个人，工牌还挂在脖子上。',
           '末班电梯，载着一层人的疲惫下楼。',
           '今天辛苦了，回去用热水多泡一会儿。',
           '十点了。'] },
  { name:'朋友聚会', kw:['朋友','聚会','聚餐','吃饭','喝酒','见面','闺蜜','兄弟','饭局'],
    tags:['朋友','日常'],
    lines:['散场后各自打车，方向相反，自然得像很久没联系。',
           '说好只喝一杯，最后互相扶着背了一路古诗。',
           '我们把同一个夜晚聊旧了，又各自带走一点。',
           '散场的时候，路灯替我们排好了队。',
           '见一面少一面，所以今天要笑够本。',
           '老地方，老样子。'] },
  { name:'一个人', kw:['一个人','独自','独处','自己','孤单','单独'],
    tags:['日常','心情'],
    lines:['习惯性的点了两杯，想起另一杯没人喝。',
           '服务员问我几位，我说两位，我和我的手机。',
           '火锅冒着热气，对面空着，蒸汽替谁坐着。',
           '对面的座位，空得很整齐。',
           '一个人也要好好吃饭，锅底选你喜欢的。',
           '一位。'] },
  { name:'吃喝', kw:['吃','美食','饭','火锅','咖啡','奶茶','蛋糕','烧烤','面','早餐','下午茶'],
    tags:['美食','日常'],
    lines:['这家店我们常来，现在只剩我一个人点单。',
           '减肥这件事，我从明天开始已经坚持了很多年。',
           '汤见了底，像一场小小的告别。',
           '热气升起来，一个人也吃得隆重。',
           '好好吃饭，天大的事吃完再说。',
           '好吃。'] },
  { name:'旅行路上', kw:['旅行','旅游','出发','路上','机场','高铁','飞机','火车','远方','自驾'],
    tags:['旅行','日常'],
    lines:['行李箱轮子的声音，在空荡荡的车站特别响。',
           '导航说我已偏离路线，我说人生不也一样。',
           '火车开着开着天就亮了，像谁提前拉开了幕布。',
           '铁轨把黄昏拉得很长，我坐在尽头。',
           '去没去过的地方，人会变软一点。',
           '出发了。'] },
  { name:'天色', kw:['晚霞','夕阳','夜景','日落','夜色','天空','月亮','星星','黄昏','下雨','雪'],
    tags:['夜色','日常'],
    lines:['晚霞那么好看，第一个想告诉的人已经不联系了。',
           '手机拍出来一团糊，看来天不同意被存进相册。',
           '天烧起来了，云一层一层往下塌。',
           '晚霞烧完这一天，就轮到月亮值班。',
           '抬头看看吧，今天的晚霞不要钱。',
           '天很好看。'] },
  { name:'带娃', kw:['娃','孩子','宝宝','儿子','女儿','带娃','幼儿园','辅导','作业'],
    tags:['日常','家庭'],
    lines:['他睡着以后，房间安静得让人心慌。',
           '他说长大要当奥特曼，我说那你先把饭吃完。',
           '小小的背影走在我前面，影子已经快比我高了。',
           '他睡着的样子，像一封拆开的信。',
           '他牵我手的时候，今天的累就都算了。',
           '终于睡了。'] },
  { name:'低落', kw:['难过','累','烦','崩溃','emo','不想','焦虑','压力','失眠','委屈','心情一般','不开心'],
    tags:['心情','日常'],
    lines:['没有什么具体的事，就是心里下了一整天的雨。',
           '在生气和窝囊之间，我选择了生窝囊气。',
           '情绪像没拧紧的水龙头，一滴一滴，不响，但一直漏。',
           '雨下了一整天，也没人问我带没带伞。',
           '今天允许自己不开心，明天再营业。',
           '算了。'] },
  { name:'周末休息', kw:['周末','休息','假期','放假','睡','躺','宅','懒'],
    tags:['周末','日常'],
    lines:['睡到中午醒来，屋子静得像被世界退了货。',
           '计划了八件事，完成了一件：醒来。',
           '阳光在地板上挪了一下午，我一步也没动。',
           '阳光挪了一下午，我陪它慢慢走。',
           '什么都没干的一天，也是被需要的一天。',
           '休息日。'] },
  { name:'看演出', kw:['话剧','剧场','电影','演唱会','演出','看展','展览','剧本杀','音乐节','live','音乐会','舞台','票','首映','影院'],
    tags:['日常','演出'],
    lines:['散场灯亮起来那一下，比剧情还让人失落。',
           '花了三百块，买两个小时不许看手机。',
           '幕布拉开的时候，现实暂时关掉了。',
           '散场的灯亮起，故事留在座位上。',
           '好好看，今晚你只是观众，不用当主角。',
           '散场了。'] },
  { name:'运动', kw:['健身','跑步','运动','游泳','瑜伽','打球','篮球','羽毛球','马拉松','锻炼','出汗','撸铁'],
    tags:['日常','运动'],
    lines:['跑完才发现，身体累了，脑子还是清醒的。',
           '办卡那一下我就瘦了，剩下的交给明天的我。',
           '汗水蒸发的时候，烦恼也跟着少了一点。',
           '汗水落在地板上，像下了一场小雨。',
           '动一动就好，不用练成谁。',
           '出汗了。'] },
  { name:'学习考试', kw:['考试','学习','读书','考研','期末','上课','复习','背书','论文','开学','成绩','作业'],
    tags:['日常','学习'],
    lines:['考完那晚什么都不想看，连答案都不想对。',
           '重点画了三遍，脑子说它不认识。',
           '台灯亮到很晚，纸上的字开始站不稳。',
           '台灯亮了一夜，替我读完最后一页。',
           '尽力就好，剩下的交给运气。',
           '考完了。'] },
  { name:'宠物', kw:['猫','狗','宠物','撸猫','遛狗','主子','毛孩子','喵','汪'],
    tags:['日常','宠物'],
    lines:['它等我回家，我也就只被它这样等过。',
           '它拆家的时候，我确信它是爱我的。',
           '它趴在窗台，把一下午睡成了一个毛球。',
           '它睡着的时候，整个屋子都安静了。',
           '今天也辛苦了，回家有它在等你。',
           '它睡了。'] },
  { name:'心动', kw:['喜欢','暗恋','表白','分手','前任','异地','想你','心动','告白','恋爱','失恋','crush','暧昧'],
    tags:['心情','日常'],
    lines:['喜欢这件事，我一个人演完了整场。',
           '聊天记录翻了三遍，每一遍都读出新意思。',
           '心动是没有声音的，但那一刻世界突然安静。',
           '心动没有声音，却吵醒了一整个夏天。',
           '喜欢就喜欢吧，不用急着有结果。',
           '想你了。'] },
  { name:'换季天气', kw:['秋天','春天','夏天','冬天','降温','好热','好冷','换季','台风','起风','入秋','入冬'],
    tags:['日常','天气'],
    lines:['换季的时候，连心情都要重新适应一遍。',
           '天气说我该穿外套了，我说我不冷。',
           '秋天是从第一片叶子开始算的，不是日历。',
           '风一吹，季节就翻了一页。',
           '降温了，记得给自己加件外套。',
           '起风了。'] },
  { name:'回家', kw:['回家','爸妈','妈妈','爸爸','家人','老家','奶奶','爷爷','年夜饭','过年','父母'],
    tags:['日常','家庭'],
    lines:['回去待三天，走的时候行李变重了。',
           '我妈觉得我瘦了，冰箱不同意。',
           '家里的灯还是那个亮度，我的眼睛却变了。',
           '回家的路很长，灯一直亮着。',
           '有空就回趟家，他们不说，其实都在等。',
           '到家了。'] },
  { name:'买东西', kw:['购物','快递','拆快递','下单','剁手','双十一','网购','退货'],
    tags:['日常','购物'],
    lines:['买的快乐，只持续到付款那一秒。',
           '说好不买了，快递员比我还了解我的底线。',
           '拆开包裹那一下，像拆一个小小的期待。',
           '拆开包裹的时候，期待也跟着打开。',
           '该买就买，别对不起今天的自己。',
           '到了。'] },
  { name:'日常', kw:[],
    tags:['日常','生活碎片'],
    lines:['日子一天天过，说不上好，也说不上不好。',
           '又活了一天，建议给自己颁个奖。',
           '晾在阳台的衣服干了，日子也算翻了一页。',
           '日子平平无奇，风都懒得翻页。',
           '普通的一天，也值得记一下。',
           '就这样。'] }
];
const IMAGE_IDX = [0,3,5];   // 图片路径取：忧郁 / 歌词 / 简短

/* ============================================================
   Prompt：这是这个产品唯一的护城河
   ============================================================ */
const SYS_PROMPT = [
  '你是一个中文社交媒体文案写手。你写的句子像真人发的动态，一眼看不出是 AI。',
  '你擅长四种网感很强的路数：忧郁（网易云热评那味）、抽象（无厘头发疯）、文艺（意象和比喻）、治愈（温柔的祝愿）。',
  '',
  '五种风格的写法：',
  '- 忧郁：丧而克制。用一件具体的小事承载情绪，结尾留白，不喊疼、不说破。',
  '  例："篝火烧到后半夜，大家都不说话了，火光替我们热闹。"',
  '- 抽象：无厘头。谐音、偷换概念、正经格式装荒诞内容、结尾突然反转。',
  '  例："老板说公司是个家，我收拾东西准备搬进去住。"',
  '- 文艺：意象。比喻、通感，把没生命的东西写活，句子可以长一点，但不堆形容词。',
  '  例："风把帐篷吹得鼓起来，像有人在外面轻轻呼吸。"',
  '- 歌词：像大热歌曲里的一句词。砍掉主谓，只剩画面和名词；允许通感错位、时间感、画面感；',
  '  句子短，自带旋律感，读出来像能唱。',
  '  例："山把晚风递过来，我们都接住了。"',
  '- 治愈：温柔的祝愿或允许。要具体到动作，不许空洞地喊"加油""会好的"。',
  '  例："今天辛苦了，回去用热水多泡一会儿。"',
  '- 简短：极短。5 到 12 个字，说完就停，靠留白。',
  '  例："十点了。"',
  '',
  '通用要求：',
  '1. 有具体细节：每句至少出现一个看得见、听得见、摸得着的东西（"汤都喝完了""工牌还挂在脖子上"），',
  '   禁止写"感受自然""享受生活""美好时光"这类抽象词。',
  '2. 说人话：口语、短句，可以是不完整的句子。',
  '3. 有情绪或态度，但不喊口号、不升华。',
  '4. 有反差更好：期待 vs 现实、热闹 vs 安静、正经 vs 荒诞、装作没事 vs 其实很在意。',
  '5. 必须紧扣用户给的场景：用户提到的具体事物（话剧的幕布/座位/散场、露营的帐篷/篝火）至少在一半以上的句子里出现。',
  '   写"放之四海皆准、换个场景也能用"的句子，是最严重的失败——那等于没写。',
  '',
  '绝对禁止：',
  '- 这些词：岁月静好、不负韶华、烟火气、治愈系、小确幸、仪式感、慢下来、惊艳、温柔了岁月、',
  '  生活碎片、今天也要开心、记录一下、如此而已、就这样吧、值了、这才叫活着、无条件快乐',
  '- 排比句、对仗句、对偶句',
  '- 总结人生道理、鸡汤结尾、升华主题',
  '- 以破折号开头、整句加引号、写序号',
  '- 使用 emoji'
].join('\n');

const FEW_SHOT = [
  '',
  '—— 照着这个水平写 ——',
  '',
  '场景：周末和朋友去露营，天特别蓝',
  '忧郁：篝火烧到后半夜，大家都不说话了，火光替我们热闹。',
  '抽象：花两千块买帐篷，就为了在户外刷手机。',
  '文艺：风把帐篷吹得鼓起来，像有人在外面轻轻呼吸。',
  '歌词：山把晚风递过来，我们都接住了。',
  '治愈：天亮之前，山会把今天的烦恼都收走。',
  '简短：火灭了，话也没了。',
  '',
  '场景：加班到十点',
  '忧郁：楼下的灯一盏盏灭掉，最后那盏是我的。',
  '抽象：老板说公司是个家，我收拾东西准备搬进去住。',
  '文艺：电梯镜子里那个人，工牌还挂在脖子上。',
  '歌词：末班电梯，载着一层人的疲惫下楼。',
  '治愈：今天辛苦了，回去用热水多泡一会儿。',
  '简短：十点了。'
].join('\n');

function matchScene(text){
  const t = String(text || '');
  let best = null, bestLen = 0, bestPos = -1;
  for(const s of FALLBACK_SCENES){
    for(const k of s.kw){
      if(!k || !t.includes(k)) continue;
      const pos = t.indexOf(k);
      // 更长的关键词优先；同样长时，出现在句子里更靠后的优先（更接近用户真正想说的）
      if(k.length > bestLen || (k.length === bestLen && pos > bestPos)){
        best = s; bestLen = k.length; bestPos = pos;
      }
    }
  }
  return best;   // 没命中就返回 null，交给「围绕用户原话」兜底
}

/* 场景库没覆盖时：至少围绕用户自己的话写，不许跑题 */
function linesFromInput(raw){
  const k = (raw || '今天').replace(/[，。！？、,.!?\s]+$/, '').slice(0, 16);
  return [
    '关于' + k + '，说出口才发现没什么好说的。',
    k + ' —— 生活总能给我整点新花样。',
    k + ' 的时候，时间比我慢了半拍。',
    k + ' 的那天，风都替我记着。',
    k + ' 也好，今天你已经在好好过了。',
    k + '。'
  ];
}

/* ---------- 状态 ---------- */
let state = {
  platform:'moments',
  mode:'create-text',
  photo:null,
  pvTags:[],
  lastReq:null,     // 用于错误重试
  resultView:null,
  libFilter:'all',
  selectedCard:-1,
  mineTags:[],
  pubScenes:[]
};

/* ---------- 存储工具 ---------- */
const load = (k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } };
const save = (k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const uid  = ()=> 'q'+Date.now()+Math.random().toString(36).slice(2,6);

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'),1900);
}

/* ============================================================
   接口层：POST /api/generate
   ============================================================ */
async function apiGenerate(payload){
  const cfg = getCfg();
  if(!cfg.key) return localGenerate(payload);

  const styles = payload.styleList;
  const pname = (PLATFORMS.find(p=>p.id===payload.platform)||{}).name || '朋友圈';
  const tone  = PLATFORM_TONE[payload.platform] || PLATFORM_TONE.moments;

  const sys = SYS_PROMPT + '\n\n' + FEW_SHOT;

  let user;
  if(payload.mode === 'polish'){
    user = '平台：' + pname + '\n原文：' + payload.text
      + '\n\n请保留原意，改写成 ' + styles.length + ' 种风格的版本。';
  } else if(payload.imageUrl){
    user = [{ type:'text', text:'平台：' + pname
      + '\n请看这张照片，先读懂画面里发生了什么、什么情绪，再配文案。' }];
    if(payload.imageUrl) user.push({ type:'image_url', image_url:{ url: payload.imageUrl } });
    user[0].text += '\n\n请生成 ' + styles.length + ' 条精选文案。';
  } else {
    user = '平台：' + pname + '\n场景：' + payload.text
      + '\n\n请生成 ' + styles.length + ' 条文案。';
  }

  const rule = '\n\n要求：\n'
    + '1. 每条风格必须不同，依次是：' + styles.join('、') + '。\n'
    + '2. 每条 8 到 30 字。' + tone + '\n'
    + '3. 每条写一个不同角度：一个写画面、一个写人、一个写反差、一个写心情、一个像歌词、一个写得极短。\n'
    + '4. 不要序号、不要引号、不要解释、不要 emoji。\n'
    + (payload.more ? '5. 务必和上一批完全不同：换细节、换动词、换情绪。\n' : '')
    + '\n只输出 JSON 数组，不要任何其他文字：\n'
    + JSON.stringify(styles.map(s=>({style:s, content:'', tags:['标签']})));

  const messages = [{ role:'system', content:sys }];
  if(Array.isArray(user)){
    const last = rule;
    user[0].text += '\n' + last;
    messages.push({ role:'user', content:user });
  } else {
    messages.push({ role:'user', content: user + '\n' + rule });
  }

  const raw = await chat(messages, !!payload.imageUrl);
  let items = parseItems(raw, styles);
  if(items.length < 2) throw { code:'FEW', msg:'模型返回的内容没法解析' };
  return { items: items.map(i=>({ id:uid(), style:i.style, content:i.content, tags:i.tags||[] })) };
}

let localBatch = 0;   // 「换一批」时轮换金句，避免每次都一样

function localGenerate(payload){
  if(payload.more) localBatch++;
  const raw = (payload.text || (state.pvTags.length ? state.pvTags.join('、') : '') || '').trim();
  const scene = matchScene(raw);
  const lines = scene ? scene.lines : linesFromInput(raw);
  const tags  = scene ? scene.tags  : ['日常','生活碎片'];
  const n = lines.length;
  const styles = payload.styleList;
  const idxs = (styles.length === 3) ? IMAGE_IDX : styles.map((_, i) => i);
  const items = styles.map((s, j)=>({
    id: uid(),
    style: s,
    content: lines[(idxs[j] + localBatch) % n],
    tags: tags
  }));
  return new Promise(r=>setTimeout(()=>r({ items }), 800));
}

/* 视觉识别：给 S7 用的轻量调用 */
async function apiDescribe(imageUrl){
  const cfg = getCfg();
  if(!cfg.key || !cfg.vision) return FALLBACK_TAGS;
  const messages = [{
    role:'user',
    content:[
      { type:'text', text:'用 3 到 5 个中文词描述这张照片的场景、主体和情绪。只输出这些词，用逗号分隔，不要任何其他文字。' },
      { type:'image_url', image_url:{ url: imageUrl } }
    ]
  }];
  try{
    const txt = await chat(messages, true);
    const words = String(txt).split(/[,，、\s\n]+/).map(s=>s.trim()).filter(s=>s && s.length<=8);
    return words.length ? words.slice(0,5) : FALLBACK_TAGS;
  }catch(e){ return FALLBACK_TAGS; }
}

/* ---------- 通用请求 ---------- */
async function chat(messages, useVision){
  const cfg = getCfg();
  const model = (useVision && cfg.vision) ? cfg.vision : cfg.model;
  let url, headers = { 'Content-Type':'application/json' };
  if(USE_PROXY && PROXY_URL){
    url = PROXY_URL; headers['X-Api-Key'] = cfg.key; headers['X-Api-Base'] = cfg.base;
  } else {
    url = (cfg.base||'').replace(/\/+$/,'') + '/chat/completions';
    headers['Authorization'] = 'Bearer ' + cfg.key;
  }
  const res = await fetch(url, {
    method:'POST', headers,
    body: JSON.stringify({ model, messages, temperature:0.95, stream:false })
  });
  if(!res.ok){
    let msg = 'HTTP ' + res.status;
    try{ const j = await res.json(); msg = (j.error && (j.error.message || j.error.code)) || msg; }catch(e){}
    throw { code:'API', msg };
  }
  const j = await res.json();
  return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
}

function parseItems(txt, styles){
  let s = String(txt).trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  let arr = null;
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  if(a>=0 && b>a){ try{ arr = JSON.parse(s.slice(a,b+1)); }catch(e){} }
  if(!arr || !arr.length){
    arr = s.split(/\n+/).map(l=>l.replace(/^\s*\d+[.、)]\s*/,'').replace(/^[-*]\s*/,'').trim())
      .filter(Boolean).map(t=>({ style:'', content:t.replace(/^["“]|["”]$/g,'') }));
  }
  return arr.filter(x=>x && (x.content||x.text))
    .slice(0, styles.length)
    .map((x,i)=>({
      style: x.style || styles[i] || STYLE_LIST[i] || '',
      content: String(x.content || x.text).replace(/^["“]|["”]$/g,'').trim(),
      tags: Array.isArray(x.tags) ? x.tags.slice(0,3) : []
    }));
}

/* ============================================================
   接口层：/api/library
   ============================================================ */
function apiLibraryAdd(item){
  const lib = load(LS_LIB, []);
  const content = (item.content||'').trim();
  if(!content) return null;
  if(lib.some(x=>x.content === content)) return lib.find(x=>x.content === content);
  const row = {
    id: uid(),
    content,
    style: item.style || '',
    tags: item.tags || [],
    platform: item.platform || state.platform,
    source: item.source || 'used',        // collected | used | written
    published: false,
    publishedAt: null,
    createdAt: Date.now()
  };
  lib.unshift(row);
  save(LS_LIB, lib.slice(0,500));
  return row;
}
function apiLibraryPatch(id, patch){
  const lib = load(LS_LIB, []);
  const row = lib.find(x=>x.id === id);
  if(!row) return null;
  if(patch.published === true){
    row.published = true;
    row.publishedAt = new Date().toISOString().slice(0,10);  // 自动填当天
  } else if(patch.published === false){
    row.published = false; row.publishedAt = null;
  }
  save(LS_LIB, lib);
  return row;
}

/* ============================================================
   视图
   ============================================================ */
const TABBED = ['home','square','library','mine'];
const TITLES = { home:'配一句', square:'广场', library:'文案库', mine:'我的',
  preview:'确认照片', loading:'', error:'', 'result-text':'配好了',
  'result-image':'配好了', 'result-polish':'润色后', publish:'发布到广场',
  write:'自己写一句', settings:'API 设置' };

function showView(name){
  $$('.view').forEach(v=>v.hidden = true);
  const el = $('#v-'+name); if(el) el.hidden = false;
  $('#navWrap').style.display = TABBED.includes(name) ? 'block' : 'none';
  $('#backBtn').hidden = !['preview','result-text','result-image','result-polish','publish','write','settings'].includes(name);
  $('#topbar').style.display = (name==='loading') ? 'none' : 'flex';
  $('#topbarTitle').textContent = TITLES[name] || '配一句';
  $('#content').scrollTop = 0;
  if(name==='library') renderLib();
  if(name==='mine') renderMine();
  if(name==='square') renderSquare();
  if(name==='home') refreshHomeFoot();
}

/* ---------- S1 首页 ---------- */
function renderPlatforms(){
  const row = $('#platformRow'); row.innerHTML='';
  PLATFORMS.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'chip' + (p.id===state.platform ? ' on' : '');
    b.textContent = p.name;
    b.onclick = ()=>{ state.platform = p.id; renderPlatforms(); };
    row.appendChild(b);
  });
}
function setMode(m){
  state.mode = m;
  $$('.seg-item').forEach(t=>t.classList.toggle('active', t.dataset.mode===m));
  $('#pane-text').hidden   = m !== 'create-text';
  $('#pane-image').hidden  = m !== 'create-image';
  $('#pane-polish').hidden = m !== 'polish';
  $('#generateBtn').textContent = m === 'polish' ? '帮我润色' : '配一句';
}
function refreshHomeFoot(){
  const cfg = getCfg();
  const el = $('#homeFoot');
  if(cfg.key){
    el.innerHTML = '已连接 ' + (cfg.model || '模型') + ' · 文案只存在这台手机';
    el.style.cursor = 'default';
    el.onclick = null;
  } else {
    el.innerHTML = '还没填 API Key，现在用的是本地文案库 · <b>点这里去填</b>';
    el.style.cursor = 'pointer';
    el.onclick = ()=>{ fillCfg(); showView('settings'); };
  }
}

/* ---------- 生成主流程 ---------- */
function setLoading(btn, on){
  if(!btn) return;
  btn.disabled = on;
  btn.classList.toggle('btn-loading', on);
}

async function runGenerate(req){
  state.lastReq = req;
  showView('loading');
  const titles = ['AI 正在帮你想…','在读你这句话…','挑个最准的说法…','快好了…'];
  let i = 0; $('#loadingTitle').textContent = titles[0];
  const timer = setInterval(()=>{ i=(i+1)%titles.length; $('#loadingTitle').textContent = titles[i]; }, 1400);

  try{
    const data = await apiGenerate(req);
    clearInterval(timer);
    bumpStat('gen', data.items.length);
    renderResult(req, data.items);
  }catch(e){
    clearInterval(timer);
    if(e && e.code === 'NO_KEY'){ /* 本地兜底不会抛这个 */ }
    showError(e && e.msg ? e.msg : '网络好像不太顺，检查一下 Key、Base URL 和模型名');
  }
}

function showError(msg){
  $('#errDesc').textContent = msg || '请求失败';
  showView('error');
}

async function generateFrom(mode, more){
  const btn = $('#generateBtn');
  let req;
  if(mode === 'polish'){
    const text = $('#polishInput').value.trim();
    if(!text){ toast('把原文粘进来'); return; }
    if(!getCfg().key){            // 润色必须真 AI，本地库改写不了你的原意
      toast('润色要连 AI 才行，先填个 Key');
      fillCfg(); showView('settings'); return;
    }
    req = { text, platform: state.platform, mode:'polish', styleList: STYLE_LIST, more: !!more };
  } else if(mode === 'create-image'){
    if(!state.photo){ toast('先选一张照片'); return; }
    req = { imageUrl: state.photo, platform: state.platform, mode:'create',
            styleList: IMAGE_STYLES, more: !!more };
  } else {
    const text = $('#ideaInput').value.trim();
    if(!text){ toast('先说点什么吧'); return; }
    req = { text, platform: state.platform, mode:'create', styleList: STYLE_LIST, more: !!more };
  }
  setLoading(btn, true);
  try{ await runGenerate(req); }
  finally{ setLoading(btn, false); }
}

/* ---------- 结果渲染 ---------- */
function renderResult(req, items){
  state.resultView = req.mode === 'polish' ? 'result-polish'
                   : (req.imageUrl ? 'result-image' : 'result-text');
  state.selectedCard = 0;

  if(state.resultView === 'result-image'){
    $('#riImg').src = req.imageUrl || '';
    const box = $('#riTags'); box.innerHTML='';
    state.pvTags.forEach(t=>box.appendChild(chipEl(t, false)));
    $('#riList').innerHTML='';
    items.forEach((it,idx)=>$('#riList').appendChild(cardEl(it, idx)));
  } else if(state.resultView === 'result-polish'){
    $('#rpOrig').textContent = req.text || '';
    $('#rpList').innerHTML='';
    items.forEach((it,idx)=>$('#rpList').appendChild(cardEl(it, idx)));
  } else {
    $('#rtPlatform').textContent = (PLATFORMS.find(p=>p.id===req.platform)||{}).name || '';
    $('#rtCount').textContent = '共 ' + items.length + ' 条 · 点卡片选中';
    $('#rtList').innerHTML='';
    items.forEach((it,idx)=>$('#rtList').appendChild(cardEl(it, idx)));
  }
  showView(state.resultView);
}

function chipEl(text, soft){
  const s = document.createElement('span');
  s.className = soft === false ? 'tag-chip' : 'tag-chip';
  s.textContent = text;
  return s;
}

function cardEl(item, idx){
  const card = document.createElement('div');
  card.className = 'card' + (idx === state.selectedCard ? ' selected' : '');

  const top = document.createElement('div');
  top.className = 'card-top';
  const sc = document.createElement('span');
  sc.className = 'style-chip'; sc.setAttribute('data-s', item.style); sc.textContent = item.style;
  top.appendChild(sc);
  if(item.tags && item.tags.length){
    item.tags.forEach(t=>{
      const tg = document.createElement('span');
      tg.className = 'tag-chip'; tg.textContent = t;
      top.appendChild(tg);
    });
  }
  card.appendChild(top);

  const body = document.createElement('div');
  body.className = 'card-text'; body.textContent = item.content;
  card.appendChild(body);

  const acts = document.createElement('div');
  acts.className = 'card-actions';
  const bFav = document.createElement('button');
  bFav.className = 'act';
  bFav.innerHTML = '<svg class="ic-18"><use href="#i-star"/></svg>收藏';
  bFav.onclick = ev=>{
    ev.stopPropagation();
    apiLibraryAdd({ content:item.content, style:item.style, tags:item.tags, source:'collected' });
    bFav.classList.add('on');
    bFav.innerHTML = '<svg class="ic-18"><use href="#i-star-f"/></svg>已收藏';
    toast('已收进文案库');
  };
  acts.appendChild(bFav);
  card.appendChild(acts);

  const copy = document.createElement('button');
  copy.className = 'copy-btn';
  copy.setAttribute('aria-label','复制');
  copy.innerHTML = '<svg class="ic-18"><use href="#i-copy"/></svg>';
  copy.onclick = ev=>{
    ev.stopPropagation();
    copyText(item.content, ()=>{
      apiLibraryAdd({ content:item.content, style:item.style, tags:item.tags, source:'used' });
      toast('已复制，顺手存进文案库');
    });
  };
  card.appendChild(copy);

  card.onclick = ()=>{
    state.selectedCard = idx;
    $$('.card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
  };
  return card;
}

function copyText(text, done){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>legacyCopy(text, done));
  } else legacyCopy(text, done);
}
function legacyCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='absolute'; ta.style.left='-9999px';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch(e){ toast('复制失败，长按选中吧'); }
  document.body.removeChild(ta);
}

/* ============================================================
   S5 广场（本地版：数据只在这台手机，真社区需接后端）
   ============================================================ */
const SQ_SEED = [
  { name:'林小满', av:'av1', text:'下班路上买了个烤红薯，烫得我一路换手。\n突然觉得今天也没那么糟。', tags:['日常','心情'], fav:12, t:'2 小时前' },
  { name:'阿七',   av:'av2', text:'朋友问我最近在忙什么。\n我想了很久，说：活着。', tags:['工作','心情'], fav:38, t:'5 小时前' },
  { name:'柚子',   av:'av3', text:'海边的风把头发吹成一团。\n算了，就这样吧，反正也没人看。', tags:['旅行','夜色'], fav:25, t:'昨天' },
  { name:'老陈',   av:'av1', text:'第一次给自己煮了顿正经饭。\n洗碗的时候有点想哭。', tags:['美食','日常'], fav:19, t:'昨天' },
  { name:'小舟',   av:'av2', text:'周末什么都没干。\n这是我能想到的最好的周末。', tags:['周末','日常'], fav:44, t:'2 天前' }
];

function getSquare(){
  let sq = load(LS_SQ, null);
  if(!sq){ sq = SQ_SEED.map(s=>Object.assign({ id:uid(), mine:false, faved:false }, s)); save(LS_SQ, sq); }
  return sq;
}
function renderSquare(){
  const sq = getSquare();
  $('#sqHint').textContent = '大家把自己喜欢的句子发出来。收藏会存进你的文案库。';
  const box = $('#sqList'); box.innerHTML = '';
  if(!sq.length){ box.innerHTML = '<p class="empty">广场还空着<br>点右上角发布第一句</p>'; return; }
  sq.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'sq-card';

    const top = document.createElement('div');
    top.className = 'sq-top';
    const av = document.createElement('div');
    av.className = 'avatar ' + (p.av || 'av1'); av.textContent = (p.name||'我').slice(0,1);
    top.appendChild(av);
    const nm = document.createElement('div');
    nm.innerHTML = '<div class="sq-name"></div><div class="sq-time"></div>';
    nm.querySelector('.sq-name').textContent = p.name;
    nm.querySelector('.sq-time').textContent = p.t;
    top.appendChild(nm);
    card.appendChild(top);

    const tx = document.createElement('div');
    tx.className = 'sq-text'; tx.textContent = p.text;
    card.appendChild(tx);

    const foot = document.createElement('div');
    foot.className = 'sq-foot';
    const tags = document.createElement('div');
    tags.className = 'sq-tags';
    (p.tags||[]).forEach(t=>{ const s=document.createElement('span'); s.className='tag-chip'; s.textContent=t; tags.appendChild(s); });
    foot.appendChild(tags);

    const fav = document.createElement('button');
    fav.className = 'sq-fav' + (p.faved ? ' on' : '');
    fav.innerHTML = '<svg class="ic-18"><use href="#' + (p.faved ? 'i-star-f' : 'i-star') + '"/></svg><span></span>';
    fav.querySelector('span').textContent = p.fav;
    fav.onclick = ()=>{
      const all = getSquare(); const row = all.find(x=>x.id===p.id); if(!row) return;
      row.faved = !row.faved; row.fav += row.faved ? 1 : -1;
      if(row.faved) apiLibraryAdd({ content: row.text, tags: row.tags, source:'collected' });
      save(LS_SQ, all); renderSquare();
      toast(row.faved ? '已收藏，存进文案库' : '取消收藏');
    };
    foot.appendChild(fav);
    card.appendChild(foot);
    box.appendChild(card);
  });
}

/* ============================================================
   S6 文案库
   ============================================================ */
function renderLib(){
  const lib = load(LS_LIB, []);
  const f = state.libFilter;
  const list = lib.filter(x=> f==='all' ? true : x.source === f);
  const box = $('#libList'); box.innerHTML = '';
  if(!list.length){
    box.innerHTML = '<p class="empty">这里还空着<br>复制或收藏任意一条文案，会自动存进来</p>';
    return;
  }
  list.forEach(row=>{
    const item = document.createElement('div');
    item.className = 'lib-item';

    const chk = document.createElement('div');
    chk.className = 'check' + (row.published ? ' on' : '');
    chk.innerHTML = row.published ? '<svg class="ic-14"><use href="#i-check"/></svg>' : '';
    chk.onclick = ()=>{
      apiLibraryPatch(row.id, { published: !row.published });
      renderLib();
    };
    item.appendChild(chk);

    const body = document.createElement('div');
    body.className = 'lib-body';
    const tx = document.createElement('div');
    tx.className = 'lib-text'; tx.textContent = row.content;
    body.appendChild(tx);

    const meta = document.createElement('div');
    meta.className = 'lib-meta';
    const src = document.createElement('span');
    src.className = 'src-tag src-' + row.source;
    src.textContent = row.source === 'collected' ? '收藏' : (row.source === 'written' ? '我写的' : '用过');
    meta.appendChild(src);
    if(row.style){
      const st = document.createElement('span');
      st.className = 'style-chip'; st.setAttribute('data-s', row.style); st.textContent = row.style;
      meta.appendChild(st);
    }
    const d = new Date(row.published && row.publishedAt ? row.publishedAt : row.createdAt);
    const dt = document.createElement('span');
    dt.className = 'lib-date' + (row.published ? ' published' : '');
    dt.textContent = fmtDate(d) + (row.published ? ' 已发' : '');
    meta.appendChild(dt);

    body.appendChild(meta);
    item.appendChild(body);
    box.appendChild(item);
  });
}
function fmtDate(d){
  const n = new Date();
  if(d.toDateString() === n.toDateString()) return '今天';
  return (d.getMonth()+1) + '/' + d.getDate();
}

/* ============================================================
   S11 我的
   ============================================================ */
function getCfg(){
  const c = load(LS_CFG, null);
  return c || { provider:'deepseek', key:'', base:PRESETS.deepseek.base,
                model:PRESETS.deepseek.model, vision:'' };
}
function bumpStat(field, n){
  const s = load(LS_STAT, { gen:0 });
  s[field] = (s[field] || 0) + n; save(LS_STAT, s);
}
function renderMine(){
  const lib = load(LS_LIB, []);
  $('#stGen').textContent = (load(LS_STAT,{gen:0}).gen) || 0;
  $('#stPub').textContent = lib.filter(x=>x.published).length;
  $('#stCol').textContent = lib.filter(x=>x.source === 'collected').length;
  let since = localStorage.getItem(LS_SINCE);
  if(!since){ since = new Date().toISOString(); localStorage.setItem(LS_SINCE, since); }
  $('#meSince').textContent = new Date(since).toLocaleDateString('zh-CN') + ' 加入内测';
}

/* ============================================================
   设置
   ============================================================ */
function fillCfg(){
  const c = getCfg();
  $('#cfgProvider').value = c.provider || 'deepseek';
  $('#cfgKey').value = c.key || '';
  $('#cfgBase').value = c.base || '';
  $('#cfgModel').value = c.model || '';
  $('#cfgVision').value = c.vision || '';
}
async function saveCfg(){
  const c = {
    provider: $('#cfgProvider').value,
    key:  $('#cfgKey').value.trim(),
    base: $('#cfgBase').value.trim().replace(/\/+$/,''),
    model:$('#cfgModel').value.trim(),
    vision:$('#cfgVision').value.trim()
  };
  save(LS_CFG, c);
  const st = $('#cfgStatus'); st.className = 'cfg-status'; st.textContent = '测试中…';
  if(!c.key){
    st.className = 'cfg-status ok';
    st.textContent = '已保存（无 Key，走本地文案库）';
    refreshHomeFoot(); return;
  }
  try{
    await chat([{ role:'user', content:'只回复两个字：收到' }], false);
    st.className = 'cfg-status ok'; st.textContent = '连接成功，可以开始配了';
  }catch(e){
    st.className = 'cfg-status err';
    st.textContent = '连接失败：' + (e.msg || '检查 Key、Base URL 和模型名');
  }
  refreshHomeFoot();
}

/* ============================================================
   绑定
   ============================================================ */
function bind(){
  /* 快捷场景 */
  QUICK.forEach(q=>{
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = q;
    b.onclick = ()=>{ $('#ideaInput').value = q; $('#ideaInput').focus(); };
    $('#quickChips').appendChild(b);
  });

  $$('.seg-item').forEach(t=>t.onclick = ()=>setMode(t.dataset.mode));

  /* S7：选照片 → 识别 → 确认 */
  $('#photoInput').onchange = e=>{
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = async ()=>{
      state.photo = r.result;
      $('#photoPreview').src = r.result; $('#photoPreview').hidden = false;
      $('#photoEmpty').hidden = true;
      $('#pvImg').src = r.result;
      $('#pvTags').innerHTML = '';
      $('#pvNote').textContent = '正在看图…';
      showView('preview');
      const tags = await apiDescribe(r.result);
      state.pvTags = tags;
      $('#pvTags').innerHTML = '';
      tags.forEach(t=>$('#pvTags').appendChild(chipEl(t)));
      const cfg = getCfg();
      $('#pvNote').textContent = (!cfg.key || !cfg.vision)
        ? '没配视觉模型，以上为默认标签。可在 API 设置里填智谱的视觉模型。'
        : '确认没问题就点「就用这张」，AI 会按画面配 3 条。';
    };
    r.readAsDataURL(f);
  };
  $('#pvReselect').onclick = ()=>{ state.photo = null; $('#photoInput').value='';
    $('#photoPreview').hidden = true; $('#photoEmpty').hidden = false; showView('home'); };
  $('#pvConfirm').onclick = ()=>generateFrom('create-image', false);

  /* 生成 */
  $('#generateBtn').onclick = ()=>{
    generateFrom(state.mode === 'create-image' ? 'create-image'
              : state.mode === 'polish' ? 'polish' : 'create-text', false);
  };
  $('#rtMore').onclick = ()=>generateFrom('create-text', true);
  $('#riMore').onclick = ()=>generateFrom('create-image', true);
  $('#rpMore').onclick = ()=>generateFrom('polish', true);

  /* 错误重试 */
  $('#errRetry').onclick = ()=>{ if(state.lastReq) runGenerate(state.lastReq); };
  $('#errBack').onclick  = ()=>showView('home');

  /* 广场 */
  $('#sqPostBtn').onclick = ()=>{ state.pubScenes = []; renderPubChips(); syncPreview(); showView('publish'); };
  $('#pubInput').oninput = syncPreview;
  $('#pubSubmit').onclick = ()=>{
    const t = $('#pubInput').value.trim();
    if(!t){ toast('还没写呢'); return; }
    const sq = getSquare();
    sq.unshift({ id:uid(), name:'我', av:'av2', text:t, tags:state.pubScenes.slice(), fav:0, t:'刚刚', mine:true, faved:false });
    save(LS_SQ, sq);
    $('#pubInput').value = '';
    toast('已发布到广场');
    showView('square');
  };
  $('#writeBtn').onclick = ()=>{ state.mineTags = []; renderMineTags(); showView('write'); };
  $('#saveMineBtn').onclick = ()=>{
    const v = $('#mineInput').value.trim();
    if(!v){ toast('还没写呢'); return; }
    apiLibraryAdd({ content:v, style: state.mineTags[0] || '', tags: state.mineTags, source:'written' });
    $('#mineInput').value = '';
    toast('存进文案库了');
    showView('library');
  };

  $$('.lib-tab').forEach(t=>t.onclick = ()=>{
    $$('.lib-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); state.libFilter = t.dataset.f; renderLib();
  });

  /* 我的 */
  $('#toSettings').onclick = ()=>{ fillCfg(); showView('settings'); };
  $('#saveCfgBtn').onclick = saveCfg;
  $('#cfgProvider').onchange = e=>{
    const p = PRESETS[e.target.value]; if(!p) return;
    if(!$('#cfgBase').value.trim() || confirm('用该服务商的默认地址和模型名覆盖？')){
      $('#cfgBase').value = p.base; $('#cfgModel').value = p.model; $('#cfgVision').value = p.vision;
    }
  };
  $('#toAbout').onclick = ()=>{ $('#aboutBox').hidden = !$('#aboutBox').hidden; };
  $('#toInstall').onclick = ()=>{
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    toast(ios ? 'Safari 底部分享 → 添加到主屏幕' : '浏览器菜单 → 添加到主屏幕');
  };
  $('#clearAllBtn').onclick = ()=>{
    if(!confirm('会清掉这台手机上的全部文案和设置，确定？')) return;
    [LS_LIB, LS_CFG, LS_STAT, LS_SQ, LS_SINCE].forEach(k=>localStorage.removeItem(k));
    toast('已清空'); showView('home'); refreshHomeFoot();
  };

  /* 分享 */
  $('#shareBtn').onclick = async ()=>{
    const data = { title:'配一句', text:'不知道怎么发？AI 帮你配一句。', url: location.href };
    if(navigator.share){ try{ await navigator.share(data); return; }catch(e){} }
    copyText(location.href, ()=>toast('链接已复制'));
  };

  /* 返回 */
  $('#backBtn').onclick = ()=>{
    const cur = $$('.view').find(v=>!v.hidden);
    const id = cur ? cur.id.replace('v-','') : '';
    const map = { settings:'mine', write:'library', publish:'square',
                  'result-text':'home', 'result-image':'home', 'result-polish':'home', preview:'home' };
    showView(map[id] || 'home');
  };

  /* 底部导航 */
  $$('.tab').forEach(t=>t.onclick = ()=>{
    $$('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); showView(t.dataset.v);
  });
}

function renderPubChips(){
  const box = $('#pubScenes'); box.innerHTML='';
  SCENES.forEach(s=>{
    const b = document.createElement('button');
    b.className = 'chip' + (state.pubScenes.includes(s) ? ' on' : '');
    b.textContent = s;
    b.onclick = ()=>{
      const i = state.pubScenes.indexOf(s);
      if(i>=0) state.pubScenes.splice(i,1); else state.pubScenes.push(s);
      renderPubChips(); syncPreview();
    };
    box.appendChild(b);
  });
}
function syncPreview(){
  const t = $('#pubInput').value.trim();
  $('#ppText').textContent = t || '还没写';
  const box = $('#ppTags'); box.innerHTML='';
  state.pubScenes.forEach(s=>{ const e=document.createElement('span'); e.className='tag-chip'; e.textContent=s; box.appendChild(e); });
}
function renderMineTags(){
  const box = $('#mineTags'); box.innerHTML='';
  STYLE_LIST.forEach(s=>{
    const b = document.createElement('button');
    b.className = 'chip' + (state.mineTags.includes(s) ? ' on' : '');
    b.textContent = s;
    b.onclick = ()=>{
      const i = state.mineTags.indexOf(s);
      if(i>=0) state.mineTags.splice(i,1); else state.mineTags.push(s);
      renderMineTags();
    };
    box.appendChild(b);
  });
}

/* ---------- 启动 ---------- */
renderPlatforms();
setMode('create-text');
bind();
showView('home');
