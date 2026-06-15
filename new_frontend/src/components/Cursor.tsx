import { useEffect } from 'react';

export default function Cursor() {
  useEffect(() => {
    const dot  = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    const onMove = (e: MouseEvent) => {
      dot.style.left  = e.clientX + 'px';
      dot.style.top   = e.clientY + 'px';
      setTimeout(() => {
        ring.style.left = e.clientX + 'px';
        ring.style.top  = e.clientY + 'px';
      }, 80);
    };
    const onEnter = () => { dot.classList.add('expand');    ring.classList.add('expand');    };
    const onLeave = () => { dot.classList.remove('expand'); ring.classList.remove('expand'); };
    const attach  = () => {
      document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };
    document.addEventListener('mousemove', onMove);
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <div id="cursor"      className="cursor"      aria-hidden="true" />
      <div id="cursor-ring" className="cursor-ring" aria-hidden="true" />
    </>
  );
}