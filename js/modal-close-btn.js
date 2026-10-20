(function(){var md=document.getElementById('md'),q=false;
function mk(){var b=document.createElement('button');b.type='button';b.className='xc noprt';b.setAttribute('aria-label','Đóng');b.title='Đóng';b.textContent='\u00d7';return b}
function scan(){q=false;var d=document.querySelector('#md:not(.hid) .dlg');
if(d&&!d.querySelector(':scope > .xc')){var b=mk();b.onclick=function(e){e.stopPropagation();var c=document.getElementById('mc');if(c)c.click();else{md.classList.add('hid');md.innerHTML=''}};d.insertBefore(b,d.firstChild)}
document.querySelectorAll('.rpo > div').forEach(function(h){if(h.querySelector(':scope > .xc'))return;var o=h.parentNode,b=mk();b.onclick=function(e){e.stopPropagation();o.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(document.body.contains(o))o.remove()};h.insertBefore(b,h.firstChild)})}
new MutationObserver(function(){if(!q){q=true;requestAnimationFrame(scan)}}).observe(document.body,{childList:true,subtree:true})})();
