#!/usr/bin/env node
// 把 blog/*.md 渲染成 blog/*.html。
//
// 为什么自己写而不是装 markdown 库：
// 站点要保持零依赖、零构建（GitHub Pages 直接托管静态文件即可），
// 而这批文章只用到标题、段落、粗体、行内代码、有序/无序列表、
// 引用、分隔线、表格这七种语法。为七种语法引入一个完整解析器，
// 换来的是以后再也不敢改样式。
//
// 用法：node tools/mdgen.js
// 只处理 blog 目录下以 .md 结尾的文件，输出同名 .html。

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 行内：先转义，再处理 `code`，最后处理 **bold**。
// 顺序不能反：先套 bold 会把 code 里的星号当粗体标记。
function inline(s) {
  let out = esc(s);

  const codes = [];
  out = out.replace(/`([^`]+)`/g, (m, c) => {
    codes.push('<code>' + c + '</code>');
    return '\u0000' + (codes.length - 1) + '\u0000';
  });

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  out = out.replace(/\u0000(\d+)\u0000/g, (m, i) => codes[Number(i)]);
  return out;
}

function isTableSep(line) {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line) && line.indexOf('-') >= 0;
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function render(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let para = [];

  function flushPara() {
    if (para.length) {
      out.push('<p>' + inline(para.join(' ')) + '</p>');
      para = [];
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      flushPara();
      i++;
      continue;
    }

    // 分隔线
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flushPara();
      out.push('<hr>');
      i++;
      continue;
    }

    // 标题
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      const lv = h[1].length;
      out.push('<h' + lv + '>' + inline(h[2].trim()) + '</h' + lv + '>');
      i++;
      continue;
    }

    // 引用：连续的 > 行合成一块
    if (/^>\s?/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push('<blockquote><p>' + inline(buf.join(' ')) + '</p></blockquote>');
      continue;
    }

    // 表格：首行含 |，次行是分隔行
    if (line.indexOf('|') >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara();
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].indexOf('|') >= 0 && !/^\s*$/.test(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      let t = '<table><thead><tr>';
      head.forEach((c) => { t += '<th>' + inline(c) + '</th>'; });
      t += '</tr></thead><tbody>';
      rows.forEach((r) => {
        t += '<tr>';
        for (let k = 0; k < head.length; k++) {
          t += '<td>' + inline(r[k] === undefined ? '' : r[k]) + '</td>';
        }
        t += '</tr>';
      });
      t += '</tbody></table>';
      out.push(t);
      continue;
    }

    // 无序列表
    if (/^\s*[-*+]\s+/.test(line)) {
      flushPara();
      out.push('<ul>');
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        out.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>');
        i++;
      }
      out.push('</ul>');
      continue;
    }

    // 有序列表
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      out.push('<ol>');
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        out.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>');
        i++;
      }
      out.push('</ol>');
      continue;
    }

    para.push(line.trim());
    i++;
  }

  flushPara();
  return out.join('\n');
}

// 从 md 里取出一级标题与第一段引用，用于 <title> 与 meta description。
function meta(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let title = '掌窗';
  let desc = '掌窗 Palmwin — 安卓上的 Windows 远程桌面客户端';
  for (const l of lines) {
    const h = /^#\s+(.*)$/.exec(l);
    if (h) { title = h[1].trim(); break; }
  }
  for (const l of lines) {
    const q = /^>\s?(.*)$/.exec(l);
    if (q) {
      desc = q[1].trim().replace(/[`*]/g, '');
      break;
    }
  }
  return { title, desc };
}

function page(title, desc, body) {
  return [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + esc(title) + ' — 掌窗</title>',
    '<meta name="description" content="' + esc(desc) + '">',
    '<link rel="stylesheet" href="../assets/style.css">',
    '</head>',
    '<body>',
    '',
    '<header class="site">',
    '  <div class="logo">掌</div>',
    '  <div class="name">掌窗 Palmwin</div>',
    '  <nav>',
    '    <a href="../index.html">首页</a>',
    '    <a href="../blog/">文章</a>',
    '    <a href="../privacy-policy.html">隐私政策</a>',
    '  </nav>',
    '</header>',
    '',
    '<div class="wrap">',
    '',
    body,
    '',
    '</div>',
    '',
    '<footer class="site"><p>掌窗 Palmwin · <a href="../privacy-policy.html">隐私政策</a></p></footer>',
    '',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function main() {
  const files = fs.readdirSync(BLOG).filter((f) => f.endsWith('.md')).sort();
  if (!files.length) {
    console.log('no markdown found in ' + BLOG);
    return;
  }
  files.forEach((f) => {
    const src = fs.readFileSync(path.join(BLOG, f), 'utf8');
    const m = meta(src);
    const html = page(m.title, m.desc, render(src));
    const outFile = path.join(BLOG, f.replace(/\.md$/, '.html'));
    fs.writeFileSync(outFile, html, 'utf8');
    console.log('built ' + f + ' -> ' + path.basename(outFile) + ' (' + html.length + ' bytes)');
  });
}

main();
