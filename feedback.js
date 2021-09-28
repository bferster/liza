//////////////////////////////////////////////////////////////////////////////////////////////////
// FEEDBACK
/////////////////////////////////////////////////////////////////////////////////////////////////

class Feedback {																				 

	constructor()																				// CONSTRUCTOR
	{
		document.addEventListener( 'mousedown', this.OnClick, false );
		this.curStudent="";																			// No one selected yet
		this.curTime=0;																				// Current time in session 0-1000
		this.maxTime=3*60*1000;																		// Time in session in ms
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		this.curStudent="";																			// No one selected yet
		$("#lz-feedbar").remove();																	// Remove old one
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o.object.name == "body") {																// If a student
			app.fb.curStudent=o.object.parent.name;													// Set name
			app.fb.Draw();																			// Show feedback
		}
	}

	Draw()																						// DRAW FEEDBACK PANEL
	{
		let _this=this;																				// Context
		$("#lz-feedbar").remove();																	// Remove old one
		var str=`<div id="lz-feedbar" class="lz-feedbar"> 
		<img src="img/closedot.gif" style="position:absolute; top:10px;left:calc(100% - 27px);cursor:pointer;"
			 onclick='$("#lz-feedbar").remove()'>
		<div class='lz-feedback'>
			<div style="width:250px;margin:4px 0 0 16px;"> 
				<b style="font-family:Chalk;font-size:48px">${this.curStudent}</b>
				<table style="font-family:Segoe UI,Verdana,Geneva,sans-serif;font-size:13px">
				<tr><td>Academic Language &nbsp;</td><td style="width:100px"><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Prior knowledge</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Use of evidence</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Flexible thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Curious thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td colspan='2'><p class="lz-bs" id="lz-v${this.curStudent}">View ${this.curStudent}'s text</p></td></tr>
				</table>
			</div>
			<div style="flex-grow:6">
				<svg width="100%" height="100%">${this.DrawMoves()}</svg>
			</div>
		</div>
		<div id='sliderTime' class='lz-slidertime'></div>
		<div id='timeSlider' class='lz-timeslider'></div>
		<img id="playerButton" src="img/playbut.png" style="position:absolute;left:calc(100% - 37px);top:184px;width:18px;cursor:pointer">`;
	
		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body
		$("#lz-feedbar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );		// Don't move orbiter
	
		$("[id^=lzDot-]").on("mouseout",(e)=>{ 	$("#lz-dlg").remove(); });							// Clear move
		$("[id^=lzDot-]").on("mouseover",(e)=>{ 
			let id=e.target.id.substr(6);
			let p=$("#lzDot-"+id).position()
			
			$("#lz-dlg").remove();
			let str=`<div id="lz-dlg" style="position:absolute;top:${p.top+24}px;left:${p.left-4}px">
			<div class='lz-textRA'></div><div class="lz-textR">What is two plus two?</div>
			<div class="lz-textS">Five, of course!</div>
			</div>`;
			$("body").append(str.replace(/\t|\n|\r/g,""))

		
		});

		$("#timeSlider").slider({																	// Init timeslider
		    max: 1000,																				// Max time in seconds
			create: function(event,ui) {															// On create
				var x=$(this).offset().left-8;														// Start
				showNow(0,x);																		// Show time																	
				},
		   slide: function (event,ui) {																// On slide
			   	let x=$($(this).children('.ui-slider-handle')).offset().left;						// Get pos       			
			    _this.curPct=ui.value;																// Set current position in session
				showNow(ui.value,x);																// Show time																	
				}
		   });
	
		function showNow(pct,x) {																	// SHOW CURRENT TIME
			let now=_this.maxTime*(pct/1000);														// Current time
			var min=Math.floor(now/60000);															// Mins
			var sec=Math.floor(now/1000)%60;														// Secs
			if (sec < 10)	sec="0"+sec;															// Add leading 0
			$("#sliderTime").html(min+":"+sec);														// Show value
			$("#sliderTime").css("left",x+14+"px")													// Position text
			}
	}
	
	DrawMoves()																					// DRAW MOVES CHART
	{
		let x,y=31,i,str="",ys=[];
		let wid=$(window).width()-320;																// Size of graph
		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#ccc">${(5-i)*100}</text>						
			<line x1="32" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:1"/>
			<text x="${wid+5}" y="${y+4}" fill="#ccc">${(5-i)*100}</text>`;							// Draw it
			y+=31;																					// Next line down
			}
		str+=`<polyline style="fill:none;stroke:#86d698;stroke-width:6;stroke-linecap:round;stroke-linejoin:round" points="`;
		for (i=0;i<15;i++) ys.push((Math.round(Math.random()*4)+1)*31);
		for (i=0;i<30;i+=2) {
			str+=i*20+35+","+ys[i/2]+" ";
			str+=(i+1)*20+35+","+ys[i/2]+" ";
			}
		str+=`"/>`;
		for (i=0;i<4;++i) {
			x=Math.floor(Math.random()*15)
			str+=`<circle id="lzDot-${i}" cx="${x*40+35}" cy="${ys[x]}" r="6" fill="#ce7070" cursor="pointer"/>`
			}
		
		
		return str
		}	

		ShowText(student)
		{
		}

}	// Class closure
