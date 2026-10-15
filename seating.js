/* Reception seating lookup. Names are fingerprinted, not published in plain text. */
(function installSeating() {
"use strict";
const seatDirectory=Object.freeze({
"852a90efc58a999409411f2c":"VIP 1","e6d3fb0c24ac56ef4d75cba6":"VIP 1","68503025f28dcc5572f4d175":"VIP 1","646185abb6413f2149d951cc":"VIP 1","48bce8db6225469b7f84a671":"VIP 1","1ac88c109445b7d1a1b8593d":"VIP 1","ad20e466adf718f7e639dfb2":"VIP 1","f4d35ee819cd5eafa544ba2e":"VIP 1","60b1d3c89d7ae34cc53d32df":"VIP 1","123d29dab118bcd37050766b":"VIP 1","e6c0feec8360ca70e8b0460c":"VIP 1","bfd95a1185f87dcc6e3c4bda":"VIP 1","0c5bb6cf22794e5d62aa8dcc":"VIP 1","ae8f887682a8d011488b4a48":"VIP 1","76e8cd5ca869a4e94fe6f0bd":"VIP 1","c9d1746fb5902e3bcea20c87":"VIP 1","af251de3f6be05fc1efb0ef4":"VIP 1",
"24186a102bd196167d1a913d":"VIP 2","3e808969ab0e2d1f1c3c6f31":"VIP 2","db88b56b0aa28b1d9516ed92":"VIP 2","9aea4828c1ae25fc4373eb31":"VIP 2","a11413347f9528eb43687b24":"VIP 2","6a2ba438cb22ea8500cf2b23":"VIP 2","4e2f35476d095616f2127501":"VIP 2","f20fe54e81f0dae22eea55a2":"VIP 2","98d3c01fafd6052f93aa88d5":"VIP 2","94c57037ba2f7004a9e98649":"VIP 2","184c60b3ab6a437fd14bdf92":"VIP 2","d6eaf1cc293eadff4f0b59a7":"VIP 2","0c9d1862098fc5d5ef361a30":"VIP 2","0b6d0906ab265a7a06255d89":"VIP 2","2b6369e2809d9a34fc8ac25f":"VIP 2","1a2d9cd2ea6c48f45a44f8f4":"VIP 2","951570d7403ebe1298119a5f":"VIP 2","f10f9f124c9049b2e18d3c67":"VIP 2",
"f7631d2acaae8e5efd9eb715":"Table 1","dfd2689ecabd3cea607d9ff6":"Table 1","f18a60574c6c0d6e6ebf1018":"Table 1","069239b1f76c354115d4626d":"Table 1","34f8b402786bc99cabc59bee":"Table 1","e475fb3950ae066d5ac438e2":"Table 1","1d0e886f7a1696edcbf166e3":"Table 1","56f4d6d9ef4ab9711badd3de":"Table 1","33af2baf4d846d91e5664017":"Table 1","b617dabcd8943ed1a3930682":"Table 1",
"cdd660974b9c4fc19a9d32c8":"Table 2","7f255b4d8f49ab74322e4457":"Table 2","b360adc54a18937326c5c15d":"Table 2","0736f0b364ba81518e80010d":"Table 2","9dbb0420a1268b95b76bb0f6":"Table 2","ee4d80a15f2eb3b5dd5d8d36":"Table 2","debe970c5463bd6c24e898fd":"Table 2","73b9283ce04b393e9d493512":"Table 2","6c1b7f86b700787d8b10cf5e":"Table 2",
"635974e79e5a7626e174f4e1":"Table 3","c068d8b733566838b0654894":"Table 3","b7d115075f2bb3dcf56622d0":"Table 3","c38ab5a4d92face81350a60b":"Table 3","4a97bf64c5c290a22c273cf6":"Table 3","c28cc21d342aafc9ea7e14e0":"Table 3","be431de7e9d0346eb0f11799":"Table 3","b9034a0efa012226f075afa8":"Table 3","5d66b355b8a85613db87d282":"Table 3","79feda067acabd0f7f106aa9":"Table 3",
"fdf25956bf6983b47ed8a28a":"Table 4","5b7869d81836774aadedb3af":"Table 4","28119c15e51f1d915cbde4a5":"Table 4","a022209d86bcd22cc3e3fc67":"Table 4","77e55985eee8b44da7c78330":"Table 4","c2e8a9cfe67bb95e9113a62a":"Table 4","468d54149ec5ab943340b457":"Table 4","c4bd3110262c43b5c78e80a2":"Table 4","2cf902bf8ac99c94de96c44d":"Table 4",
"4e7e6b516cad29d5133fbd5b":"Table 5","c3a05c856dbb20911f1d092a":"Table 5","befd3a46cd1a6c1b1e944b96":"Table 5","1c56549b9de09d59b0cfb79d":"Table 5","a61a60f0cccd20b6d30ff0a7":"Table 5","f9a75ff958db15f8feae84d0":"Table 5","73fb5b664c6eb78f1a59f616":"Table 5","5749ff473810d6da46fb772f":"Table 5",
"9fcf6e1d47f2379dcec5def5":"Table 6","e63355e1072e9ff6f80268ba":"Table 6","b96dc655a79d567f12c5929d":"Table 6","5565b11d64a1a9d53e606f3a":"Table 6","73b4a9f59671a05b42a48ddb":"Table 6","0cce46f9b1586888613c5825":"Table 6","13ad1e1facda5512839d29a9":"Table 6","936eb86e6d364e6e345fce36":"Table 6","8738e2b573b0dbaab5414221":"Table 6"
});
const form=document.getElementById("seatLookupForm");
const input=document.getElementById("seatSearch");
const feedback=document.getElementById("seatResult");
const button=document.getElementById("searchButton");
const modal=document.getElementById("seatModal");
const close=document.getElementById("seatModalClose");
const nameView=document.getElementById("seatModalName");
const tableView=document.getElementById("seatModalTable");
const messageView=document.getElementById("seatModalMessage");
const diagram=document.getElementById("seatMap");
if(!form||!input||!feedback||!button||!modal||!close||!nameView||!tableView||!messageView||!diagram)return;
const normalizeName=value=>value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9\s]/g," ").trim().replace(/\s+/g," ");
async function digestName(name){
  if(!window.crypto||!window.crypto.subtle)throw Error("Secure lookup unavailable");
  const bytes=new TextEncoder().encode(normalizeName(name));
  const hash=await window.crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("").slice(0,24);
}
function circleTable(n,x,y){
  return `<g class="seat-map-place" data-seat-id="Table ${n}">
    <circle class="seat-map-halo" cx="${x}" cy="${y}" r="91"/>
    <circle class="seat-map-shape" cx="${x}" cy="${y}" r="71"/>
    <circle class="seat-map-rim" cx="${x}" cy="${y}" r="67"/>
    <text class="seat-map-number" x="${x}" y="${y+22}" text-anchor="middle">${n}</text>
    <use href="#seat-spray" transform="translate(${x-78} ${y+49})"/>
  </g>`;
}
function vipTable(n,x){
  return `<g class="seat-map-place" data-seat-id="VIP ${n}">
    <rect class="seat-map-halo" x="${x-12}" y="432" width="126" height="318" rx="10"/>
    <rect class="seat-map-shape" x="${x}" y="447" width="102" height="290"/>
    <rect class="seat-map-rim" x="${x+4}" y="451" width="94" height="282"/>
    <text class="seat-map-vip-text" x="0" y="0" text-anchor="middle"
          transform="translate(${x+52} 595) rotate(-90)">VIP ${n}</text>
  </g>`;
}
diagram.innerHTML=`
<svg class="seat-layout-art" viewBox="0 0 1055 1491" role="img"
  aria-label="Reception seating plan with stage at top; VIP 1 on left, VIP 2 on right; tables 1, 3, 2, 4 across the center and tables 5 and 6 below; entrance bottom right">
<defs>
  <radialGradient id="seat-paper"><stop stop-color="#fffefa"/><stop offset="1" stop-color="#f9f0e5"/></radialGradient>
  <linearGradient id="seat-gold" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#a77b31"/><stop offset=".5" stop-color="#ebce85"/><stop offset="1" stop-color="#a77b31"/>
  </linearGradient>
  <radialGradient id="seat-lavender"><stop stop-color="#f5e2f0"/><stop offset="1" stop-color="#dec0da"/></radialGradient>
  <radialGradient id="seat-picked"><stop stop-color="#fff9f4"/><stop offset=".4" stop-color="#efc7ff"/><stop offset="1" stop-color="#be7bd9"/></radialGradient>
  <g id="seat-flower">
    <ellipse cx="0" cy="-11" rx="7" ry="13" fill="#fef9ed" stroke="#a9977b"/>
    <ellipse cx="11" cy="0" rx="7" ry="13" fill="#ede0eb" stroke="#bda0b7" transform="rotate(72 11 0)"/>
    <ellipse cx="7" cy="11" rx="7" ry="13" fill="#fcf6ed" stroke="#a9977b" transform="rotate(144 7 11)"/>
    <ellipse cx="-8" cy="11" rx="7" ry="13" fill="#dfbdd8" stroke="#ba95af" transform="rotate(216 -8 11)"/>
    <ellipse cx="-11" cy="0" rx="7" ry="13" fill="#fdf4e9" stroke="#a9977b" transform="rotate(288 -11 0)"/>
    <circle r="4" fill="#c79e49"/>
  </g>
  <g id="seat-spray">
    <path d="M7 43Q67 0 149 33" fill="none" stroke="#9c8c59" stroke-width="2.2"/>
    <path d="M23 32q-25-17-23-29 23 7 23 29ZM87 24q17-26 35-26-8 23-35 26ZM125 30q19 3 25 22-20-4-25-22Z"
          fill="#91a087" opacity=".8"/>
    <use href="#seat-flower" transform="translate(46 25) scale(.87)"/>
    <use href="#seat-flower" transform="translate(81 22) scale(.74)"/>
    <use href="#seat-flower" transform="translate(118 30) scale(1)"/>
  </g>
  <g id="seat-corner">
    <path d="M-5 -5Q95 15 174 111M-5 35Q64 59 109 157M33 -5Q67 49 151 71"
          fill="none" stroke="#be9a64" stroke-width="3"/>
    <ellipse cx="70" cy="55" rx="19" ry="36" fill="#a2ac91" opacity=".65" transform="rotate(-35 70 55)"/>
    <ellipse cx="110" cy="83" rx="16" ry="30" fill="#a2ac91" opacity=".65" transform="rotate(38 110 83)"/>
    <use href="#seat-flower" transform="translate(40 30) scale(2.4)"/>
    <use href="#seat-flower" transform="translate(113 75) scale(1.8)"/>
    <use href="#seat-flower" transform="translate(25 107) scale(1.5)"/>
  </g>
</defs>
<rect width="1055" height="1491" fill="url(#seat-paper)"/>
<rect x="15" y="15" width="1025" height="1461" rx="13" fill="none"
      stroke="url(#seat-gold)" stroke-width="2" opacity=".45"/>
<use href="#seat-corner"/>
<use href="#seat-corner" transform="translate(1055 0) scale(-1 1)"/>
<use href="#seat-corner" transform="translate(0 1491) scale(1 -1)"/>
<use href="#seat-corner" transform="translate(1055 1491) scale(-1 -1)"/>
<text class="seat-map-heading" x="527" y="92" text-anchor="middle">RECEPTION SEATING PLAN</text>
<path d="M319 113h175m65 0h175" stroke="url(#seat-gold)" stroke-width="2"/>
<path d="M527 103l10 10-10 10-10-10z" fill="none" stroke="#b88b3a" stroke-width="2"/>
<rect x="125" y="146" width="780" height="116" fill="url(#seat-lavender)"
      stroke="url(#seat-gold)" stroke-width="3"/>
<text class="seat-map-large-label" x="515" y="218" text-anchor="middle">Stage</text>
<circle cx="201" cy="350" r="65" fill="url(#seat-lavender)" stroke="url(#seat-gold)" stroke-width="3"/>
<text class="seat-map-small-label" x="201" y="342" text-anchor="middle">Couples</text>
<text class="seat-map-small-label" x="201" y="377" text-anchor="middle">Table</text>
<use href="#seat-spray" transform="translate(123 381)"/>
<circle cx="833" cy="350" r="65" fill="url(#seat-lavender)" stroke="url(#seat-gold)" stroke-width="3"/>
<text class="seat-map-small-label" x="833" y="342" text-anchor="middle">Wedding</text>
<text class="seat-map-small-label" x="833" y="377" text-anchor="middle">Cake</text>
<use href="#seat-spray" transform="translate(762 381)"/>
<rect x="350" y="341" width="329" height="312" fill="#fbf3ea"
      stroke="url(#seat-gold)" stroke-width="3"/>
<path d="M372 360l281 267M434 347l215 236M376 517l104 112" stroke="#ddbf98" opacity=".35" fill="none"/>
<text class="seat-map-large-label" x="515" y="512" text-anchor="middle">Dance Floor</text>
${vipTable(1,174)}
${vipTable(2,751)}
${circleTable(1,116,835)}
${circleTable(3,359,835)}
${circleTable(2,665,835)}
${circleTable(4,909,835)}
${circleTable(5,251,1003)}
${circleTable(6,778,1003)}
<path d="M28 1122h972" stroke="url(#seat-gold)" stroke-width="2"/>
<path d="M515 1112l10 10-10 10-10-10z" fill="none" stroke="#ac7933" stroke-width="2"/>
<rect x="41" y="1140" width="201" height="257" fill="url(#seat-lavender)"
  stroke="url(#seat-gold)" stroke-width="3"/>
<text class="seat-map-small-label" text-anchor="middle" transform="translate(143 1271) rotate(-90)">Comfort Room</text>
<rect x="929" y="1140" width="60" height="264" fill="url(#seat-lavender)"
  stroke="url(#seat-gold)" stroke-width="3"/>
<text class="seat-map-small-label" text-anchor="middle" transform="translate(968 1271) rotate(-90)">Entrance</text>
</svg>`;
let returnFocus=null;
let priorOverflow="";
let busy=false;
function error(message){feedback.hidden=false;feedback.textContent=message;feedback.classList.add("is-error");}
function hideModal(){
  if(modal.hidden)return;
  modal.hidden=true;
  document.body.style.overflow=priorOverflow;
  if(returnFocus&&typeof returnFocus.focus==="function")returnFocus.focus();
}
function showModal(name,table){
  nameView.textContent="Welcome, "+name+"!";
  tableView.textContent=table;
  messageView.textContent="We are so happy you'll celebrate with us! We have highlighted your "+(table.startsWith("VIP")?"seating area":"table")+" below to help you find your place.";
  diagram.querySelectorAll("[data-seat-id]").forEach(node=>{
    node.classList.toggle("is-selected",node.getAttribute("data-seat-id")===table);
  });
  returnFocus=document.activeElement;
  priorOverflow=document.body.style.overflow;
  feedback.hidden=true;
  feedback.textContent="";
  feedback.classList.remove("is-error");
  modal.hidden=false;
  document.body.style.overflow="hidden";
  close.focus();
}
form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(busy)return;
  const enteredName=input.value.trim().replace(/\s+/g," ");
  if(normalizeName(enteredName).split(" ").length<2){
    error("Please enter your full first and last name.");
    input.focus();return;
  }
  busy=true;button.disabled=true;button.textContent="Searching...";feedback.hidden=true;
  try{
    const fingerprint=await digestName(enteredName);
    const table=seatDirectory[fingerprint];
    if(table)showModal(enteredName,table);
    else error("We couldn't find that name on our seating list. Please check the full name on your invitation or ask our wedding coordinator for assistance.");
  }catch(err){
    error("The seating lookup is temporarily unavailable. Please try again in a moment.");
  }finally{busy=false;button.disabled=false;button.textContent="Find My Table";}
});
close.addEventListener("click",hideModal);
modal.addEventListener("click",event=>{if(event.target===modal)hideModal();});
document.addEventListener("keydown",event=>{
  if(modal.hidden)return;
  if(event.key==="Escape"){hideModal();return;}
  if(event.key==="Tab"){
    const controls=Array.from(modal.querySelectorAll("button,a[href],input"))
      .filter(el=>!el.disabled&&el.getClientRects().length);
    if(!controls.length)return;
    if(event.shiftKey&&document.activeElement===controls[0]){
      event.preventDefault();controls[controls.length-1].focus();
    } else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){
      event.preventDefault();controls[0].focus();
    }
  }
});
})();
