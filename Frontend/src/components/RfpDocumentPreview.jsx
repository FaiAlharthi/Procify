import { useState, useLayoutEffect, useRef } from 'react';
import './RfpDocumentPreview.css';

function RfpDocumentPreview({ docNumber, date, status, title, preparedBy, sections }) {
  const [pages, setPages] = useState([{ sections: sections.slice(0, 2), isFirst: true }]);
  const containerRef = useRef(null);
  const measureRef = useRef(null);

  const sectionsKey = sections.map((s) => s.value).join('\x00');

  useLayoutEffect(() => {
    const container = containerRef.current;
    const meas = measureRef.current;
    if (!container || !meas) return;

    const pageWidth = container.offsetWidth;
    if (pageWidth === 0) return;

    // A4 height minus top+bottom padding (44px each)
    const a4ContentHeight = pageWidth * (297 / 210) - 88;

    const headerEl = meas.querySelector('[data-mheader]');
    const headerH = headerEl?.offsetHeight ?? 120;

    const contEl = meas.querySelector('[data-mcont]');
    const contH = contEl?.offsetHeight ?? 40;

    // --space-5 = 20px (margin-bottom on each section except last)
    const SECTION_MARGIN = 20;
    // --space-6 = 24px (margin-top on .rfp-doc-sections, first page only)
    const SECTIONS_TOP_MARGIN = 24;

    // Temporarily override the first measurement section's content, read its height, then restore.
    function measureItem(label, value) {
      const el = meas.querySelector('[data-msection="0"]');
      if (!el) return 80;
      const labelEl = el.querySelector('[data-mslabel]');
      const textEl = el.querySelector('[data-mstext]');
      const prevLabel = labelEl?.textContent;
      const prevText = textEl?.textContent;
      const prevEmpty = textEl?.classList.contains('is-empty');

      if (labelEl) labelEl.textContent = label;
      if (textEl) {
        textEl.textContent = value || 'Awaiting input...';
        textEl.classList.toggle('is-empty', !value);
      }
      const h = el.offsetHeight;

      if (labelEl) labelEl.textContent = prevLabel;
      if (textEl) {
        textEl.textContent = prevText;
        textEl.classList.toggle('is-empty', prevEmpty);
      }
      return h;
    }

    // Binary-search the longest prefix of `value` whose section height fits within maxH.
    function splitText(label, value, maxH) {
      const el = meas.querySelector('[data-msection="0"]');
      if (!el) return { first: value, rest: '' };
      const labelEl = el.querySelector('[data-mslabel]');
      const textEl = el.querySelector('[data-mstext]');
      const prevLabel = labelEl?.textContent;
      const prevText = textEl?.textContent;
      const prevEmpty = textEl?.classList.contains('is-empty');

      if (labelEl) labelEl.textContent = label;
      if (textEl) textEl.classList.remove('is-empty');

      const words = (value || '').split(' ');
      let lo = 0, hi = words.length;

      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (textEl) textEl.textContent = words.slice(0, mid).join(' ');
        if (el.offsetHeight <= maxH) lo = mid;
        else hi = mid - 1;
      }

      if (labelEl) labelEl.textContent = prevLabel;
      if (textEl) {
        textEl.textContent = prevText;
        textEl.classList.toggle('is-empty', prevEmpty);
      }

      return {
        first: words.slice(0, lo).join(' '),
        rest: words.slice(lo).join(' '),
      };
    }

    // Build display-item queue: {label, value, isContinued}
    let remaining = sections.map((s) => ({ label: s.label, value: s.value, isContinued: false }));
    let isFirst = true;
    const newPages = [];

    while (remaining.length > 0) {
      const fixedH = isFirst ? headerH + SECTIONS_TOP_MARGIN : contH;
      const pageAvailable = a4ContentHeight - fixedH;

      const pageSections = [];
      let usedH = 0;

      while (remaining.length > 0) {
        const item = remaining[0];
        const itemH = measureItem(item.label, item.value) + SECTION_MARGIN;

        if (pageSections.length === 0 && itemH > pageAvailable) {
          // Too tall for an entire page — split at a word boundary
          const { first, rest } = splitText(item.label, item.value, pageAvailable - SECTION_MARGIN);
          if (first.trim()) {
            pageSections.push({ ...item, value: first });
            remaining[0] = { ...item, value: rest, isContinued: true };
          } else {
            // Edge case: even one word is too tall — force-place to avoid infinite loop
            pageSections.push(item);
            remaining.shift();
          }
          break;
        } else if (usedH + itemH > pageAvailable) {
          // Doesn't fit on this page; start a new one
          break;
        } else {
          pageSections.push(item);
          usedH += itemH;
          remaining.shift();
        }
      }

      if (pageSections.length === 0) {
        remaining.shift(); // safety — prevent infinite loop
      } else {
        newPages.push({ sections: pageSections, isFirst });
      }
      isFirst = false;
    }

    setPages(newPages.length > 0 ? newPages : [{ sections: [], isFirst: true }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey, title]);

  // Map section label → 1-based number so split continuations share the same number
  const sectionNumberMap = Object.fromEntries(sections.map((s, i) => [s.label, i + 1]));

  function renderSection(s, key) {
    return (
      <div className="rfp-doc-section" key={key}>
        <p className="rfp-doc-section-label">
          {sectionNumberMap[s.label]}. {s.label}{s.isContinued ? ' (cont.)' : ''}
        </p>
        <p className={`rfp-doc-section-text${s.value ? '' : ' is-empty'}`}>
          {s.value || 'Awaiting input...'}
        </p>
      </div>
    );
  }

  return (
    <div className="rfp-preview-bg" ref={containerRef} style={{ position: 'relative' }}>

      {/* Hidden measurement page — grows freely so we can read real heights */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, visibility: 'hidden', pointerEvents: 'none' }}
      >
        <div
          ref={measureRef}
          className="rfp-page"
          style={{ height: 'auto', minHeight: 0, aspectRatio: 'auto', boxShadow: 'none', overflow: 'visible' }}
        >
          <div data-mheader="">
            <div className="rfp-doc-top">
              <div>
                <p className="rfp-doc-kicker">Request for Proposal</p>
                <p className="rfp-doc-meta">Document #{docNumber} &bull; {status}</p>
              </div>
              <span className="rfp-doc-date">{date}</span>
            </div>
            <hr className="rfp-doc-divider" />
            <h2 className="rfp-doc-title">{title || 'Untitled Project'}</h2>
            {preparedBy && <p className="rfp-doc-prepared">{preparedBy}</p>}
          </div>
          <div data-mcont="">
            <p className="rfp-page-cont">Continued</p>
          </div>
          {sections.map((s, i) => (
            <div key={i} data-msection={i} className="rfp-doc-section">
              <p data-mslabel="" className="rfp-doc-section-label">{s.label}</p>
              <p data-mstext="" className={`rfp-doc-section-text${s.value ? '' : ' is-empty'}`}>
                {s.value || 'Awaiting input...'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actual A4 pages */}
      {pages.map((page, pageIdx) => (
        <div className="rfp-page" key={pageIdx}>
          {page.isFirst ? (
            <>
              <div className="rfp-doc-top">
                <div>
                  <p className="rfp-doc-kicker">Request for Proposal</p>
                  <p className="rfp-doc-meta">Document #{docNumber} &bull; {status}</p>
                </div>
                <span className="rfp-doc-date">{date}</span>
              </div>
              <hr className="rfp-doc-divider" />
              <h2 className="rfp-doc-title">{title || 'Untitled Project'}</h2>
              {preparedBy && <p className="rfp-doc-prepared">{preparedBy}</p>}
              <div className="rfp-doc-sections">
                {page.sections.map((s, sIdx) => renderSection(s, `${pageIdx}-${sIdx}`))}
              </div>
            </>
          ) : (
            <>
              <p className="rfp-page-cont">Continued &mdash; {title || 'Untitled Project'}</p>
              <div className="rfp-doc-sections rfp-doc-sections-top">
                {page.sections.map((s, sIdx) => renderSection(s, `${pageIdx}-${sIdx}`))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default RfpDocumentPreview;
