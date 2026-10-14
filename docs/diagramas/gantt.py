# Genera docs/img/gantt.png  ->  python docs/diagramas/gantt.py
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, matplotlib.dates as md
from datetime import date, timedelta
HOY = date(2026,10,14)
T = [  # (fase, tarea, inicio, fin, responsable)
 ("Análisis","Definición del tema y propuesta",date(2026,8,31),date(2026,9,11),"Todos"),
 ("Análisis","Stakeholders y personas",date(2026,9,7),date(2026,9,18),"J. Ortega"),
 ("Análisis","PACT y actividades",date(2026,9,14),date(2026,9,25),"J. Ortega"),
 ("Análisis","RF, RNF e historias de usuario",date(2026,9,21),date(2026,10,2),"J. Ortega / Int. 2"),
 ("Análisis","Análisis comparativo",date(2026,9,21),date(2026,9,30),"Int. 3"),
 ("Diseño","3 alternativas de diseño",date(2026,9,28),date(2026,10,7),"Int. 3 / Int. 4"),
 ("Diseño","Prototipo fidelidad media + simulación",date(2026,10,1),date(2026,10,13),"Int. 4 / J. Ortega"),
 ("Diseño","Matriz de trazabilidad y C4",date(2026,10,5),date(2026,10,13),"J. Ortega / Int. 2"),
 ("Diseño","Entrega PC02 + video",date(2026,10,12),date(2026,10,14),"Todos"),
 ("Desarrollo","Sprint 1: núcleo PWA + LLM gateway",date(2026,10,19),date(2026,11,1),"Int. 2"),
 ("Desarrollo","Sprint 2: voz (vishing, STT/TTS)",date(2026,10,26),date(2026,11,8),"J. Ortega"),
 ("Desarrollo","Sprint 3: perfil adaptativo + offline",date(2026,11,2),date(2026,11,15),"Int. 3"),
 ("Desarrollo","Sprint 4: salas, torneos, cinturones",date(2026,11,9),date(2026,11,22),"Int. 4"),
 ("Desarrollo","Contenido: 15 escenarios y guardrails",date(2026,10,19),date(2026,11,22),"Todos"),
 ("Evaluación","Pruebas de usabilidad (SUS) e iteración",date(2026,11,23),date(2026,12,2),"Todos"),
 ("Evaluación","Documentación final (README, C4, instalación)",date(2026,11,23),date(2026,12,4),"Int. 2"),
 ("Evaluación","Entrega final y sustentación",date(2026,12,7),date(2026,12,9),"Todos"),
]
COL={"Análisis":"#6b8fb5","Diseño":"#b53a22","Desarrollo":"#4f9a5a","Evaluación":"#c79a2e"}
fig,ax=plt.subplots(figsize=(14,7.2),dpi=160)
for i,(f,t,a,b,r) in enumerate(T):
    y=len(T)-1-i; dur=(b-a).days+1
    done = 1.0 if b<=HOY else max(0,(HOY-a).days+1)/dur if a<=HOY else 0
    ax.barh(y,dur,left=md.date2num(a),color=COL[f],alpha=.30,height=.62,edgecolor=COL[f])
    if done: ax.barh(y,dur*done,left=md.date2num(a),color=COL[f],height=.62)
    ax.text(md.date2num(b)+1.2,y,r,va="center",fontsize=8,color="#444")
ax.set_yticks(range(len(T))); ax.set_yticklabels([t for _,t,*_ in T][::-1],fontsize=9)
ax.axvline(md.date2num(HOY),color="#1f1d1a",ls="--",lw=1.2); ax.text(md.date2num(HOY)+.5,len(T)-.3,"Hoy: PC02 (14/10)",fontsize=9)
ax.xaxis.set_major_locator(md.WeekdayLocator(byweekday=md.MO)); ax.xaxis.set_major_formatter(md.DateFormatter("%d/%m"))
plt.setp(ax.get_xticklabels(),rotation=45,fontsize=8); ax.grid(axis="x",alpha=.25)
ax.set_xlim(md.date2num(date(2026,8,28)),md.date2num(date(2026,12,20)))
for s in ("top","right"): ax.spines[s].set_visible(False)
from matplotlib.patches import Patch
ax.legend(handles=[Patch(color=c,label=k) for k,c in COL.items()]+[Patch(facecolor="#999",alpha=.3,label="Pendiente")],loc="lower left",fontsize=8,frameon=False)
ax.set_title("CyberDojo · Diagrama de Gantt (semestre 2026-II) — relleno = avance",fontsize=12,loc="left")
plt.tight_layout(); plt.savefig(__file__.rsplit("/",2)[0]+"/img/gantt.png")
