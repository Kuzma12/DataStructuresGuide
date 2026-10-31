// Java editor: CodeMirror 5 from cdnjs when available, otherwise a capable textarea fallback.

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16';
let loading;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadCodeMirror() {
  if (window.CodeMirror) return Promise.resolve(true);
  if (!loading) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${CDN}/codemirror.min.css`;
    document.head.appendChild(css);
    loading = loadScript(`${CDN}/codemirror.min.js`)
      .then(() =>
        Promise.all([
          loadScript(`${CDN}/mode/clike/clike.min.js`),
          loadScript(`${CDN}/addon/edit/matchbrackets.min.js`),
          loadScript(`${CDN}/addon/edit/closebrackets.min.js`),
          loadScript(`${CDN}/addon/selection/active-line.min.js`),
        ]),
      )
      .then(() => true)
      .catch(() => false);
  }
  return loading;
}

export async function createEditor(host, { value = '', readOnly = false, onChange, onRun } = {}) {
  const ok = await Promise.race([loadCodeMirror(), new Promise((r) => setTimeout(() => r(false), 4000))]);
  return ok && window.CodeMirror ? codeMirrorEditor(host, { value, readOnly, onChange, onRun }) : textareaEditor(host, { value, readOnly, onChange, onRun });
}

function codeMirrorEditor(host, { value, readOnly, onChange, onRun }) {
  host.innerHTML = '';
  const cm = window.CodeMirror(host, {
    value,
    mode: 'text/x-java',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: !readOnly,
    readOnly,
    viewportMargin: Infinity,
    extraKeys: {
      Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ', 'end')),
      'Shift-Tab': (c) => c.indentSelection('subtract'),
      'Ctrl-Enter': () => onRun?.(),
      'Cmd-Enter': () => onRun?.(),
      'Ctrl-/': 'toggleComment',
    },
  });
  if (onChange) cm.on('change', () => onChange(cm.getValue()));
  let marks = [];
  return {
    getValue: () => cm.getValue(),
    setValue: (v) => cm.setValue(v),
    focus: () => cm.focus(),
    refresh: () => cm.refresh(),
    markErrors(lines) {
      this.clearMarks();
      for (const line of lines) {
        const h = cm.addLineClass(line - 1, 'background', 'cm-error-line');
        marks.push(h);
      }
      if (lines.length) cm.scrollIntoView({ line: lines[0] - 1, ch: 0 }, 80);
    },
    clearMarks() {
      for (const h of marks) cm.removeLineClass(h, 'background', 'cm-error-line');
      marks = [];
    },
    gotoLine(line) {
      cm.focus();
      cm.setCursor({ line: line - 1, ch: 0 });
      cm.scrollIntoView({ line: line - 1, ch: 0 }, 80);
    },
  };
}

function textareaEditor(host, { value, readOnly, onChange, onRun }) {
  host.innerHTML = '<div class="ta-editor"><pre class="ta-gutter" aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div>';
  const ta = host.querySelector('textarea');
  const gutter = host.querySelector('.ta-gutter');
  ta.value = value;
  ta.readOnly = readOnly;
  const syncGutter = () => {
    const n = ta.value.split('\n').length;
    gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(320, ta.scrollHeight)}px`;
  };
  ta.addEventListener('input', () => {
    syncGutter();
    onChange?.(ta.value);
  });
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: t } = ta;
      ta.setRangeText('    ', s, t, 'end');
      ta.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter') {
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      const indentation = ta.value.slice(lineStart, s).match(/^\s*/)[0];
      const extra = ta.value[s - 1] === '{' ? '    ' : '';
      e.preventDefault();
      ta.setRangeText(`\n${indentation}${extra}`, s, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  });
  syncGutter();
  return {
    getValue: () => ta.value,
    setValue: (v) => {
      ta.value = v;
      syncGutter();
    },
    focus: () => ta.focus(),
    refresh: syncGutter,
    markErrors() {},
    clearMarks() {},
    gotoLine(line) {
      const lines = ta.value.split('\n');
      const pos = lines.slice(0, line - 1).reduce((a, l) => a + l.length + 1, 0);
      ta.focus();
      ta.setSelectionRange(pos, pos + (lines[line - 1] || '').length);
    },
  };
}
