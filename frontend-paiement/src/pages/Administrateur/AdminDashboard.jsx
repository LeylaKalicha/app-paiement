// import { useState, useEffect } from "react";
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";
// import GestionUtilisateurs from "./GestionUtilisateurs";
// import GestionNotifications from "./GestionNotifications";
// import MethodesPaiement from "./MethodesPaiement";
// import GestionTransactions from "./GestionTransactions";
// import GestionSecurite from "./GestionSecurite";
// import GestionCartes from "./GestionCartes";
// import Profil from "./Profil"; 
// import GestionFonds from "./GestionFonds";

// const Icons = {
//   dashboard:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
//   funds:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
//   users:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//   transactions:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
//   payment:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
//   cards:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
//   notifications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
//   security:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
//   profile:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
//   logout:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
//   bell:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
//   search:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
//   chevronLeft:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
//   chevronRight:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
//   close:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
// };

// // Suppression de "security" des items du menu
// const menuItems = [
//   { id: "dashboard",     label: "Tableau de bord",         icon: Icons.dashboard },
//   { id: "funds",         label: "Gestion des fonds",        icon: Icons.funds },
//   { id: "users",         label: "Gestion des utilisateurs", icon: Icons.users },
//   { id: "transactions",  label: "Gestion des transactions", icon: Icons.transactions },
//   { id: "payment",       label: "Méthodes de paiement",     icon: Icons.payment },
//   { id: "cards",         label: "Ajouter des cartes",       icon: Icons.cards },
//   { id: "notifications", label: "Notifications",            icon: Icons.notifications },
//   { id: "profile",       label: "Profil",                   icon: Icons.profile },
// ];

// const C = {
//   sidebar:       "#2e1065",
//   sidebarBorder: "#3b0764",
//   sidebarHover:  "rgba(167,139,250,0.15)",
//   activeItem:    "#a78bfa",
//   activeBg:      "rgba(167,139,250,0.18)",
//   textPrimary:   "#f5f3ff",
//   textMuted:     "#c4b5fd",
//   accent:        "#7c3aed",
//   danger:        "#ef4444",
//   bg:            "#f8fafc",
//   white:         "#ffffff",
//   border:        "#e2e8f0",
//   textDark:      "#0f172a",
//   textGray:      "#64748b",
// };

// const StatCard = ({ label, valeur, sous, icon, onClick, loading }) => (
//   <div onClick={onClick} style={{
//     background:C.white,borderRadius:10,padding:"16px 20px",flex:1,minWidth:140,
//     boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:`1px solid ${C.border}`,
//     cursor:onClick?"pointer":"default",transition:"all 0.15s",
//     display:"flex",alignItems:"center",justifyContent:"space-between",gap:12
//   }}
//     onMouseEnter={e=>{if(onClick){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.boxShadow=`0 0 0 3px ${C.accent}18`;}}}
//     onMouseLeave={e=>{if(onClick){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.06)";}}}
//   >
//     <div>
//       <div style={{fontSize:11,color:C.textGray,fontWeight:600,marginBottom:6,letterSpacing:0.4,textTransform:"uppercase"}}>{label}</div>
//       <div style={{fontSize:22,fontWeight:800,color:loading?"#cbd5e1":C.textDark,lineHeight:1,minWidth:40,minHeight:24,borderRadius:loading?4:0,background:loading?"#f1f5f9":"transparent",transition:"all 0.2s"}}>
//         {loading ? "" : valeur}
//       </div>
//       {sous&&<div style={{fontSize:11,color:C.textGray,marginTop:5}}>{loading?"…":sous}</div>}
//     </div>
//     <div style={{width:38,height:38,borderRadius:8,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,flexShrink:0}}>
//       {icon}
//     </div>
//   </div>
// );

// function BannerBienvenue({admin,onClose}){
//   if(!admin)return null;
//   const h=new Date().getHours();
//   const salut=h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir";
//   return(
//     <div style={{background:"linear-gradient(135deg,#7c3aed0d,#a78bfa08)",borderRadius:10,padding:"16px 20px",marginBottom:20,border:"1px solid #ede9fe",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
//       <div style={{display:"flex",alignItems:"center",gap:12}}>
//         <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:"0 4px 12px rgba(124,58,237,0.3)"}}>
//           {admin.nom?.[0]?.toUpperCase()||"A"}
//         </div>
//         <div>
//           <div style={{fontWeight:700,fontSize:14,color:C.textDark}}>{salut}, {admin.nom} 👋</div>
//           <div style={{fontSize:12,color:C.textGray,marginTop:2}}>{admin.email} · <span style={{color:C.accent,fontWeight:600}}>Administrateur</span></div>
//         </div>
//       </div>
//       <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textGray,display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:6,padding:0}}>{Icons.close}</button>
//     </div>
//   );
// }

// function DashboardContenu({allerVers,admin}){
//   const[showBanner,setShowBanner]=useState(true);
//   const[stats,setStats]=useState(null);
//   const[graphData,setGraphData]=useState([]);
//   const[loadingStats,setLoadingStats]=useState(true);

//   useEffect(()=>{
//     const token=localStorage.getItem("token");
//     const headers={Authorization:`Bearer ${token}`};
//     api.get("/admin/stats",{headers})
//       .then(r=>setStats(r.data))
//       .catch(err=>console.error("Erreur stats:",err))
//       .finally(()=>setLoadingStats(false));

//     api.get("/admin/transactions?limite=200",{headers})
//       .then(r=>{
//         const parJour = r.data.parJour || [];
//         const formatted = parJour.map(d=>({
//           jour: d.date ? new Date(d.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}) : "?",
//           Validées: Number(d.completee)||0,
//           Annulées: Number(d.echouee)||0,
//         }));
//         setGraphData(formatted);
//       })
//       .catch(err=>console.error("Erreur graphique:",err));
//   },[]);

//   const fcfa = (v) => v==null?"XAF 0":`XAF ${Number(v).toLocaleString("fr-FR")}`;

//   return(
//     <div>
//       {showBanner&&<BannerBienvenue admin={admin} onClose={()=>setShowBanner(false)}/>}
//       <div style={{marginBottom:20}}>
//         <h2 style={{fontSize:18,fontWeight:800,color:C.textDark,margin:0}}>Tableau de bord</h2>
//         <p style={{color:C.textGray,fontSize:13,marginTop:3}}>Suivez les métriques clés de la plateforme</p>
//       </div>

//       <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
//         <StatCard label="Total transactions" valeur={stats?.totalTransactions ?? 0} sous={`Aujourd'hui : ${stats?.transactionsAujourdhui ?? 0}`} icon={Icons.transactions} onClick={()=>allerVers("transactions")} loading={loadingStats} />
//         <StatCard label="Total clients" valeur={stats?.totalClients ?? 0} sous={`Suspendus : ${stats?.comptesSuspendus ?? 0}`} icon={Icons.users} onClick={()=>allerVers("users")} loading={loadingStats} />
//         <StatCard label="Montant en appli" valeur={fcfa(stats?.soldeTotal)} sous="Solde cumulé tous comptes" icon={Icons.funds} onClick={()=>allerVers("funds")} loading={loadingStats} />
//         <StatCard label="Cartes actives" valeur={stats?.totalCartes ?? 0} sous="Cartes utilisateurs actives" icon={Icons.cards} onClick={()=>allerVers("cards")} loading={loadingStats} />
//         <StatCard label="Comptes suspendus" valeur={stats?.comptesSuspendus ?? 0} sous="Comptes bloqués" icon={Icons.security} onClick={()=>allerVers("users")} loading={loadingStats} />
//       </div>

//       {/* Raccourcis - Bouton Sécurité supprimé ici */}
//       <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
//         {[
//           {label:"Utilisateurs", page:"users",         icon:Icons.users},
//           {label:"Notifications",page:"notifications",icon:Icons.notifications},
//           {label:"Transactions", page:"transactions", icon:Icons.transactions},
//         ].map(btn=>(
//           <button key={btn.page} onClick={()=>allerVers(btn.page)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:C.white,color:C.textGray,fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.15s"}}
//             onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background="#f5f3ff";}}
//             onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textGray;e.currentTarget.style.background=C.white;}}
//           >
//             <span style={{display:"flex"}}>{btn.icon}</span>{btn.label}
//           </button>
//         ))}
//       </div>

//       <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
//         <div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
//           <div style={{fontWeight:700,fontSize:13,color:C.textDark,marginBottom:2}}>Transactions — 7 derniers jours</div>
//           <div style={{fontSize:11,color:C.textGray,marginBottom:12}}>Validées vs Annulées</div>
//           {graphData.length === 0 ? (
//             <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:C.textGray,fontSize:12}}>Aucune transaction sur cette période</div>
//           ) : (
//             <ResponsiveContainer width="100%" height={160}>
//               <BarChart data={graphData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
//                 <XAxis dataKey="jour" tick={{fontSize:10,fill:C.textGray}} axisLine={false} tickLine={false}/>
//                 <YAxis tick={{fontSize:10,fill:C.textGray}} axisLine={false} tickLine={false} allowDecimals={false}/>
//                 <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/>
//                 <Bar dataKey="Validées" fill={C.accent} radius={[4,4,0,0]}/>
//                 <Bar dataKey="Annulées" fill={C.danger} radius={[4,4,0,0]}/>
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//         </div>

//         <div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
//           <div style={{fontWeight:700,fontSize:13,color:C.textDark,marginBottom:16}}>Résumé plateforme</div>
//           {[
//             {label:"Transactions aujourd'hui", val:loadingStats?"…":stats?.transactionsAujourdhui??0, color:C.accent},
//             {label:"Total transactions",       val:loadingStats?"…":stats?.totalTransactions??0,    color:C.accent},
//             {label:"Clients actifs",           val:loadingStats?"…":stats?.totalClients??0,         color:"#10b981"},
//             {label:"Comptes suspendus",        val:loadingStats?"…":stats?.comptesSuspendus??0,     color:C.danger},
//             {label:"Cartes actives",           val:loadingStats?"…":stats?.totalCartes??0,          color:"#f59e0b"},
//           ].map(row=>(
//             <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid #f8fafc`}}>
//               <span style={{fontSize:12,color:C.textGray}}>{row.label}</span>
//               <span style={{fontSize:13,fontWeight:700,color:row.color}}>{row.val}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function TableauDeBord(){
//   const navigate=useNavigate();
//   const[pageActive,setPageActive]=useState("dashboard");
//   const[menuOuvert,setMenuOuvert]=useState(true);
//   const[showConfirm,setShowConfirm]=useState(false);
//   const[admin,setAdmin]=useState(null);
//   const[loading,setLoading]=useState(true);

//   useEffect(()=>{
//     const fetchAdmin=async()=>{
//       try{
//         const token=localStorage.getItem("token");
//         if(!token){navigate("/login");return;}
//         const response=await api.get("/admin/me",{headers:{Authorization:`Bearer ${token}`}});
//         setAdmin(response.data.admin);
//       }catch{
//         localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");
//       }finally{setLoading(false);}
//     };
//     fetchAdmin();
//   },[navigate]);

//   const allerVers=(id)=>setPageActive(id);
//   const deconnecter=()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");};

//   const renderPage=()=>{
//     switch(pageActive){
//       case"dashboard":    return<DashboardContenu allerVers={allerVers} admin={admin}/>;
//       case"users":        return<GestionUtilisateurs allerVers={allerVers}/>;
//       case"notifications":return<GestionNotifications allerVers={allerVers}/>;
//       case"payment":      return<MethodesPaiement allerVers={allerVers}/>;
//       case"transactions": return<GestionTransactions allerVers={allerVers}/>;
//       case"security":     return<GestionSecurite allerVers={allerVers}/>;
//       case"cards":        return<GestionCartes allerVers={allerVers}/>;
//       case"profile":      return<Profil allerVers={allerVers}/>;
//       case"funds":        return<GestionFonds allerVers={allerVers}/>;
//       default:            return null;
//     }
//   };

//   if(loading)return(
//     <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg}}>
//       <div style={{textAlign:"center"}}>
//         <div style={{width:44,height:44,borderRadius:12,background:C.sidebar,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:"#fff",fontWeight:800,fontSize:20}}>PV</div>
//         <div style={{fontSize:13,color:C.textGray,fontWeight:600}}>Chargement...</div>
//       </div>
//     </div>
//   );

//   return(
//     <div style={{display:"flex",height:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",background:C.bg}}>
//       <div style={{
//         width:menuOuvert?232:60,minHeight:"100vh",
//         background:C.sidebar,
//         transition:"width 0.22s cubic-bezier(.4,0,.2,1)",
//         overflow:"hidden",flexShrink:0,position:"relative",
//         display:"flex",flexDirection:"column",
//         borderRight:`1px solid ${C.sidebarBorder}`,
//       }}>
//         {/* Icône éclair supprimée ici */}
//         <div style={{padding:menuOuvert?"18px 16px":"18px 12px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.sidebarBorder}`,minHeight:64}}>
//           {menuOuvert&&<span style={{color:C.textPrimary,fontWeight:700,fontSize:14,whiteSpace:"nowrap",letterSpacing:-0.3,marginLeft:menuOuvert?0:4}}>PayVirtual Admin</span>}
//         </div>

//         {menuOuvert&&admin&&(
//           <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.sidebarBorder}`}}>
//             <div style={{display:"flex",alignItems:"center",gap:10}}>
//               <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>
//                 {admin.nom?.[0]?.toUpperCase()||"A"}
//               </div>
//               <div style={{overflow:"hidden"}}>
//                 <div style={{color:C.textPrimary,fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{admin.nom}</div>
//                 <div style={{color:C.textMuted,fontSize:10,marginTop:1}}>Administrateur</div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div style={{padding:"8px 6px",flex:1,overflowY:"auto"}}>
//           {menuOuvert&&<div style={{padding:"8px 10px 4px",fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,textTransform:"uppercase"}}>Navigation</div>}
//           {menuItems.map(item=>{
//             const isActive=pageActive===item.id;
//             return(
//               <div key={item.id} onClick={()=>allerVers(item.id)} title={!menuOuvert?item.label:""}
//                 style={{display:"flex",alignItems:"center",gap:10,padding:menuOuvert?"8px 10px":"8px 12px",borderRadius:7,cursor:"pointer",marginBottom:1,background:isActive?C.activeBg:"transparent",color:isActive?C.activeItem:C.textMuted,transition:"all 0.12s",justifyContent:menuOuvert?"flex-start":"center"}}
//                 onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color=C.textPrimary;}}}
//                 onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted;}}}
//               >
//                 <span style={{display:"flex",flexShrink:0}}>{item.icon}</span>
//                 {menuOuvert&&<span style={{fontSize:13,fontWeight:isActive?600:400,whiteSpace:"nowrap"}}>{item.label}</span>}
//                 {isActive&&menuOuvert&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:C.activeItem,flexShrink:0}}/>}
//               </div>
//             );
//           })}
//         </div>

//         <div style={{padding:"6px 6px 52px",borderTop:`1px solid ${C.sidebarBorder}`}}>
//           <div onClick={()=>setShowConfirm(true)} title={!menuOuvert?"Déconnexion":""}
//             style={{display:"flex",alignItems:"center",gap:10,padding:menuOuvert?"8px 10px":"8px 12px",borderRadius:7,cursor:"pointer",color:C.textMuted,transition:"all 0.12s",justifyContent:menuOuvert?"flex-start":"center"}}
//             onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.15)";e.currentTarget.style.color="#fca5a5";}}
//             onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted;}}
//           >
//             <span style={{display:"flex",flexShrink:0}}>{Icons.logout}</span>
//             {menuOuvert&&<span style={{fontSize:13,fontWeight:500}}>Déconnexion</span>}
//           </div>
//         </div>

//         <button onClick={()=>setMenuOuvert(!menuOuvert)} style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:C.sidebarBorder,border:"none",borderRadius:6,padding:"5px 8px",color:C.textMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
//           onMouseEnter={e=>{e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color=C.textPrimary;}}
//           onMouseLeave={e=>{e.currentTarget.style.background=C.sidebarBorder;e.currentTarget.style.color=C.textMuted;}}
//         >
//           {menuOuvert?Icons.chevronLeft:Icons.chevronRight}
//         </button>
//       </div>

//       <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
//         <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
//           <div style={{display:"flex",alignItems:"center",gap:6}}>
//             <span style={{color:C.textGray,fontSize:13}}>Accueil</span>
//             <span style={{color:C.border,fontSize:13}}>›</span>
//             <span style={{color:C.accent,fontWeight:600,fontSize:13}}>{menuItems.find(m=>m.id===pageActive)?.label}</span>
//           </div>
//           <div style={{display:"flex",alignItems:"center",gap:12}}>
//             <div style={{display:"flex",alignItems:"center",gap:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px"}}>
//               <span style={{color:C.textGray,display:"flex"}}>{Icons.search}</span>
//               <input placeholder="Rechercher..." style={{border:"none",background:"transparent",fontSize:13,outline:"none",color:C.textDark,width:160}}/>
//             </div>
//             <div style={{position:"relative",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,background:C.white}}>
//               <span style={{color:C.textGray,display:"flex"}}>{Icons.bell}</span>
//               <span style={{position:"absolute",top:6,right:6,background:C.danger,width:7,height:7,borderRadius:"50%",border:`2px solid ${C.white}`}}/>
//             </div>
//             <div onClick={()=>allerVers("profile")} style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",transition:"opacity 0.15s",boxShadow:"0 2px 8px rgba(124,58,237,0.3)"}}
//               onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
//               onMouseLeave={e=>e.currentTarget.style.opacity="1"}
//             >
//               {admin?.nom?.[0]?.toUpperCase()||"A"}
//             </div>
//           </div>
//         </div>

//         <div style={{flex:1,overflow:"auto",padding:22}}>{renderPage()}</div>
//       </div>

//       {showConfirm&&(
//         <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
//           <div style={{background:C.white,borderRadius:14,padding:28,width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
//             <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
//               <div style={{width:40,height:40,borderRadius:10,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",color:C.danger}}>{Icons.logout}</div>
//               <div>
//                 <div style={{fontWeight:700,fontSize:15,color:C.textDark}}>Se déconnecter</div>
//                 <div style={{fontSize:12,color:C.textGray,marginTop:2}}>Cette action fermera votre session</div>
//               </div>
//             </div>
//             <p style={{fontSize:13,color:C.textGray,marginBottom:20,lineHeight:1.6}}>Êtes-vous sûr de vouloir vous déconnecter de PayVirtual Admin ?</p>
//             <div style={{display:"flex",gap:10}}>
//               <button onClick={()=>setShowConfirm(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textGray}}>Annuler</button>
//               <button onClick={deconnecter} style={{flex:1,background:C.danger,color:C.white,border:"none",borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Se déconnecter</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }















import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GestionUtilisateurs from "./GestionUtilisateurs";
import GestionNotifications from "./GestionNotifications";
import MethodesPaiement from "./MethodesPaiement";
import GestionTransactions from "./GestionTransactions";
import GestionSecurite from "./GestionSecurite";
import GestionCartes from "./GestionCartes";
import Profil from "./Profil"; 
import GestionFonds from "./GestionFonds";

const Icons = {
  dashboard:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  funds:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  users:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  transactions:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  payment:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  cards:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  notifications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  security:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  profile:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  search:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  chevronLeft:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  close:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── GestionFraude supprimé du menu ──────────────────────────────
const menuItems = [
  { id: "dashboard",     label: "Tableau de bord",         icon: Icons.dashboard },
  { id: "funds",         label: "Gestion des fonds",        icon: Icons.funds },
  { id: "users",         label: "Gestion des utilisateurs", icon: Icons.users },
  { id: "transactions",  label: "Gestion des transactions", icon: Icons.transactions },
  { id: "payment",       label: "Méthodes de paiement",     icon: Icons.payment },
  { id: "cards",         label: "Ajouter des cartes",       icon: Icons.cards },
  { id: "notifications", label: "Notifications",            icon: Icons.notifications },
  { id: "security",      label: "Sécurité",                 icon: Icons.security },
  { id: "profile",       label: "Profil",                   icon: Icons.profile },
];

// ─── PALETTE ────────────────────────────────────────────────────
const C = {
  sidebar:       "#2e1065",
  sidebarBorder: "#3b0764",
  sidebarHover:  "rgba(167,139,250,0.15)",
  activeItem:    "#a78bfa",
  activeBg:      "rgba(167,139,250,0.18)",
  textPrimary:   "#f5f3ff",
  textMuted:     "#c4b5fd",
  accent:        "#7c3aed",
  danger:        "#ef4444",
  bg:            "#f8fafc",
  white:         "#ffffff",
  border:        "#e2e8f0",
  textDark:      "#0f172a",
  textGray:      "#64748b",
};

// ─── STAT CARD ──────────────────────────────────────────────────
const StatCard = ({ label, valeur, sous, icon, onClick, loading }) => (
  <div onClick={onClick} style={{
    background:C.white,borderRadius:10,padding:"16px 20px",flex:1,minWidth:140,
    boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:`1px solid ${C.border}`,
    cursor:onClick?"pointer":"default",transition:"all 0.15s",
    display:"flex",alignItems:"center",justifyContent:"space-between",gap:12
  }}
    onMouseEnter={e=>{if(onClick){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.boxShadow=`0 0 0 3px ${C.accent}18`;}}}
    onMouseLeave={e=>{if(onClick){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.06)";}}}
  >
    <div>
      <div style={{fontSize:11,color:C.textGray,fontWeight:600,marginBottom:6,letterSpacing:0.4,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:loading?"#cbd5e1":C.textDark,lineHeight:1,minWidth:40,minHeight:24,borderRadius:loading?4:0,background:loading?"#f1f5f9":"transparent",transition:"all 0.2s"}}>
        {loading ? "" : valeur}
      </div>
      {sous&&<div style={{fontSize:11,color:C.textGray,marginTop:5}}>{loading?"…":sous}</div>}
    </div>
    <div style={{width:38,height:38,borderRadius:8,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",color:C.accent,flexShrink:0}}>
      {icon}
    </div>
  </div>
);

// ─── BANNER BIENVENUE ───────────────────────────────────────────
function BannerBienvenue({admin,onClose}){
  if(!admin)return null;
  const h=new Date().getHours();
  const salut=h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir";
  return(
    <div style={{background:"linear-gradient(135deg,#7c3aed0d,#a78bfa08)",borderRadius:10,padding:"16px 20px",marginBottom:20,border:"1px solid #ede9fe",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:"0 4px 12px rgba(124,58,237,0.3)"}}>
          {admin.nom?.[0]?.toUpperCase()||"A"}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.textDark}}>{salut}, {admin.nom} 👋</div>
          <div style={{fontSize:12,color:C.textGray,marginTop:2}}>{admin.email} · <span style={{color:C.accent,fontWeight:600}}>Administrateur</span></div>
        </div>
      </div>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textGray,display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:6,padding:0}}>{Icons.close}</button>
    </div>
  );
}

// ─── DASHBOARD CONTENU ──────────────────────────────────────────
// Toutes les données viennent de l'API : /api/admin/stats et /api/admin/transactions
function DashboardContenu({allerVers,admin}){
  const[showBanner,setShowBanner]=useState(true);
  const[stats,setStats]=useState(null);
  const[graphData,setGraphData]=useState([]);
  const[loadingStats,setLoadingStats]=useState(true);

  useEffect(()=>{
    const token=localStorage.getItem("token");
    const headers={Authorization:`Bearer ${token}`};

    // Charger stats réelles
    api.get("/admin/stats",{headers})
      .then(r=>setStats(r.data))
      .catch(err=>console.error("Erreur stats:",err))
      .finally(()=>setLoadingStats(false));

    // Charger données graphique (transactions 7 derniers jours)
    api.get("/admin/transactions?limite=200",{headers})
      .then(r=>{
        // parJour : [{date, completee, echouee}]
        const parJour = r.data.parJour || [];
        // Formater pour Recharts : label = date courte
        const formatted = parJour.map(d=>({
          jour: d.date ? new Date(d.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}) : "?",
          Validées: Number(d.completee)||0,
          Annulées: Number(d.echouee)||0,
        }));
        setGraphData(formatted);
      })
      .catch(err=>console.error("Erreur graphique:",err));
  },[]);

  // Formater montant FCFA
  const fcfa = (v) => v==null?"XAF 0":`XAF ${Number(v).toLocaleString("fr-FR")}`;

  return(
    <div>
      {showBanner&&<BannerBienvenue admin={admin} onClose={()=>setShowBanner(false)}/>}
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:18,fontWeight:800,color:C.textDark,margin:0}}>Tableau de bord</h2>
        <p style={{color:C.textGray,fontSize:13,marginTop:3}}>Suivez les métriques clés de la plateforme</p>
      </div>

      {/* ── STAT CARDS connectées à /api/admin/stats ── */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
        <StatCard
          label="Total transactions"
          valeur={stats?.totalTransactions ?? 0}
          sous={`Aujourd'hui : ${stats?.transactionsAujourdhui ?? 0}`}
          icon={Icons.transactions}
          onClick={()=>allerVers("transactions")}
          loading={loadingStats}
        />
        <StatCard
          label="Total clients"
          valeur={stats?.totalClients ?? 0}
          sous={`Suspendus : ${stats?.comptesSuspendus ?? 0}`}
          icon={Icons.users}
          onClick={()=>allerVers("users")}
          loading={loadingStats}
        />
        <StatCard
          label="Montant en appli"
          valeur={fcfa(stats?.soldeTotal)}
          sous="Solde cumulé tous comptes"
          icon={Icons.funds}
          onClick={()=>allerVers("funds")}
          loading={loadingStats}
        />
        <StatCard
          label="Cartes actives"
          valeur={stats?.totalCartes ?? 0}
          sous="Cartes utilisateurs actives"
          icon={Icons.cards}
          onClick={()=>allerVers("cards")}
          loading={loadingStats}
        />
        <StatCard
          label="Comptes suspendus"
          valeur={stats?.comptesSuspendus ?? 0}
          sous="Comptes bloqués"
          icon={Icons.security}
          onClick={()=>allerVers("users")}
          loading={loadingStats}
        />
      </div>

      {/* Raccourcis */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {label:"Utilisateurs", page:"users",        icon:Icons.users},
          {label:"Notifications",page:"notifications",icon:Icons.notifications},
          {label:"Transactions", page:"transactions", icon:Icons.transactions},
          {label:"Sécurité",     page:"security",     icon:Icons.security},
        ].map(btn=>(
          <button key={btn.page} onClick={()=>allerVers(btn.page)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:C.white,color:C.textGray,fontWeight:600,fontSize:12,cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background="#f5f3ff";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textGray;e.currentTarget.style.background=C.white;}}
          >
            <span style={{display:"flex"}}>{btn.icon}</span>{btn.label}
          </button>
        ))}
      </div>

      {/* ── GRAPHIQUES connectés aux vraies données ── */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>

        {/* Graphique transactions par jour (7 derniers jours) */}
        <div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{fontWeight:700,fontSize:13,color:C.textDark,marginBottom:2}}>Transactions — 7 derniers jours</div>
          <div style={{fontSize:11,color:C.textGray,marginBottom:12}}>Validées vs Annulées</div>
          {graphData.length === 0 ? (
            <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:C.textGray,fontSize:12}}>
              Aucune transaction sur cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="jour" tick={{fontSize:10,fill:C.textGray}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:C.textGray}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${C.border}`,fontSize:12}}/>
                <Bar dataKey="Validées" fill={C.accent} radius={[4,4,0,0]}/>
                <Bar dataKey="Annulées" fill={C.danger} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Résumé rapide */}
        <div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{fontWeight:700,fontSize:13,color:C.textDark,marginBottom:16}}>Résumé plateforme</div>
          {[
            {label:"Transactions aujourd'hui", val:loadingStats?"…":stats?.transactionsAujourdhui??0, color:C.accent},
            {label:"Total transactions",       val:loadingStats?"…":stats?.totalTransactions??0,    color:C.accent},
            {label:"Clients actifs",           val:loadingStats?"…":stats?.totalClients??0,         color:"#10b981"},
            {label:"Comptes suspendus",        val:loadingStats?"…":stats?.comptesSuspendus??0,     color:C.danger},
            {label:"Cartes actives",           val:loadingStats?"…":stats?.totalCartes??0,          color:"#f59e0b"},
          ].map(row=>(
            <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid #f8fafc`}}>
              <span style={{fontSize:12,color:C.textGray}}>{row.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:row.color}}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TABLEAU DE BORD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function TableauDeBord(){
  const navigate=useNavigate();
  const[pageActive,setPageActive]=useState("dashboard");
  const[menuOuvert,setMenuOuvert]=useState(true);
  const[showConfirm,setShowConfirm]=useState(false);
  const[admin,setAdmin]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    const fetchAdmin=async()=>{
      try{
        const token=localStorage.getItem("token");
        if(!token){navigate("/login");return;}
        const response=await api.get("/admin/me",{headers:{Authorization:`Bearer ${token}`}});
        setAdmin(response.data.admin);
      }catch{
        localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");
      }finally{setLoading(false);}
    };
    fetchAdmin();
  },[navigate]);

  const allerVers=(id)=>setPageActive(id);
  const deconnecter=()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");};

  const renderPage=()=>{
    switch(pageActive){
      case"dashboard":    return<DashboardContenu allerVers={allerVers} admin={admin}/>;
      case"users":        return<GestionUtilisateurs allerVers={allerVers}/>;
      case"notifications":return<GestionNotifications allerVers={allerVers}/>;
      case"payment":      return<MethodesPaiement allerVers={allerVers}/>;
      case"transactions": return<GestionTransactions allerVers={allerVers}/>;
      case"security":     return<GestionSecurite allerVers={allerVers}/>;
      case"cards":        return<GestionCartes allerVers={allerVers}/>;
      case"profile":      return<Profil allerVers={allerVers}/>;
      case"funds":        return<GestionFonds allerVers={allerVers}/>;
      default:            return null;
    }
  };

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:44,height:44,borderRadius:12,background:C.sidebar,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:"#fff",fontWeight:800,fontSize:20}}>⚡</div>
        <div style={{fontSize:13,color:C.textGray,fontWeight:600}}>Chargement...</div>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",background:C.bg}}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width:menuOuvert?232:60,minHeight:"100vh",
        background:C.sidebar,
        transition:"width 0.22s cubic-bezier(.4,0,.2,1)",
        overflow:"hidden",flexShrink:0,position:"relative",
        display:"flex",flexDirection:"column",
        borderRight:`1px solid ${C.sidebarBorder}`,
      }}>
        {/* Logo — "PayVirtual Admin" à la place de "Manager Board" */}
        <div style={{padding:menuOuvert?"18px 16px":"18px 12px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.sidebarBorder}`,minHeight:64}}>
          <div style={{width:32,height:32,background:"#a78bfa",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0}}>⚡</div>
          {menuOuvert&&<span style={{color:C.textPrimary,fontWeight:700,fontSize:14,whiteSpace:"nowrap",letterSpacing:-0.3}}>PayVirtual Admin</span>}
        </div>

        {/* Info admin */}
        {menuOuvert&&admin&&(
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.sidebarBorder}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>
                {admin.nom?.[0]?.toUpperCase()||"A"}
              </div>
              <div style={{overflow:"hidden"}}>
                <div style={{color:C.textPrimary,fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{admin.nom}</div>
                <div style={{color:C.textMuted,fontSize:10,marginTop:1}}>Administrateur</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{padding:"8px 6px",flex:1,overflowY:"auto"}}>
          {menuOuvert&&<div style={{padding:"8px 10px 4px",fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:1,textTransform:"uppercase"}}>Navigation</div>}
          {menuItems.map(item=>{
            const isActive=pageActive===item.id;
            return(
              <div key={item.id} onClick={()=>allerVers(item.id)} title={!menuOuvert?item.label:""}
                style={{display:"flex",alignItems:"center",gap:10,padding:menuOuvert?"8px 10px":"8px 12px",borderRadius:7,cursor:"pointer",marginBottom:1,background:isActive?C.activeBg:"transparent",color:isActive?C.activeItem:C.textMuted,transition:"all 0.12s",justifyContent:menuOuvert?"flex-start":"center"}}
                onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color=C.textPrimary;}}}
                onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted;}}}
              >
                <span style={{display:"flex",flexShrink:0}}>{item.icon}</span>
                {menuOuvert&&<span style={{fontSize:13,fontWeight:isActive?600:400,whiteSpace:"nowrap"}}>{item.label}</span>}
                {isActive&&menuOuvert&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:C.activeItem,flexShrink:0}}/>}
              </div>
            );
          })}
        </div>

        {/* Déconnexion */}
        <div style={{padding:"6px 6px 52px",borderTop:`1px solid ${C.sidebarBorder}`}}>
          <div onClick={()=>setShowConfirm(true)} title={!menuOuvert?"Déconnexion":""}
            style={{display:"flex",alignItems:"center",gap:10,padding:menuOuvert?"8px 10px":"8px 12px",borderRadius:7,cursor:"pointer",color:C.textMuted,transition:"all 0.12s",justifyContent:menuOuvert?"flex-start":"center"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.15)";e.currentTarget.style.color="#fca5a5";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted;}}
          >
            <span style={{display:"flex",flexShrink:0}}>{Icons.logout}</span>
            {menuOuvert&&<span style={{fontSize:13,fontWeight:500}}>Déconnexion</span>}
          </div>
        </div>

        {/* Toggle */}
        <button onClick={()=>setMenuOuvert(!menuOuvert)} style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:C.sidebarBorder,border:"none",borderRadius:6,padding:"5px 8px",color:C.textMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color=C.textPrimary;}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.sidebarBorder;e.currentTarget.style.color=C.textMuted;}}
        >
          {menuOuvert?Icons.chevronLeft:Icons.chevronRight}
        </button>
      </div>

      {/* ── CONTENU ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:C.textGray,fontSize:13}}>Accueil</span>
            <span style={{color:C.border,fontSize:13}}>›</span>
            <span style={{color:C.accent,fontWeight:600,fontSize:13}}>{menuItems.find(m=>m.id===pageActive)?.label}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px"}}>
              <span style={{color:C.textGray,display:"flex"}}>{Icons.search}</span>
              <input placeholder="Rechercher..." style={{border:"none",background:"transparent",fontSize:13,outline:"none",color:C.textDark,width:160}}/>
            </div>
            <div style={{position:"relative",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,background:C.white}}>
              <span style={{color:C.textGray,display:"flex"}}>{Icons.bell}</span>
              <span style={{position:"absolute",top:6,right:6,background:C.danger,width:7,height:7,borderRadius:"50%",border:`2px solid ${C.white}`}}/>
            </div>
            <div onClick={()=>allerVers("profile")} style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",transition:"opacity 0.15s",boxShadow:"0 2px 8px rgba(124,58,237,0.3)"}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            >
              {admin?.nom?.[0]?.toUpperCase()||"A"}
            </div>
          </div>
        </div>

        {/* Page */}
        <div style={{flex:1,overflow:"auto",padding:22}}>{renderPage()}</div>
      </div>

      {/* ── MODAL DÉCONNEXION ── */}
      {showConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:C.white,borderRadius:14,padding:28,width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:40,height:40,borderRadius:10,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",color:C.danger}}>{Icons.logout}</div>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:C.textDark}}>Se déconnecter</div>
                <div style={{fontSize:12,color:C.textGray,marginTop:2}}>Cette action fermera votre session</div>
              </div>
            </div>
            <p style={{fontSize:13,color:C.textGray,marginBottom:20,lineHeight:1.6}}>Êtes-vous sûr de vouloir vous déconnecter de PayVirtual Admin ?</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowConfirm(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer",color:C.textGray}}>Annuler</button>
              <button onClick={deconnecter} style={{flex:1,background:C.danger,color:C.white,border:"none",borderRadius:8,padding:"9px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}