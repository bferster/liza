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
		this.curStart=0;																			// Start in msecs
		this.startPlay;																				// When play started in msecs
		this.interval=null;																			// Timer
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		this.curStudent="";																			// No one selected yet
		$("#lz-feedbar").remove();																	// Remove old one
		clearInterval(this.interval);																// Clear timer
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
				<tr><td colspan='2'><p class="lz-bs" id="lz-v${this.curStudent}" onclick="app.fb.ShowText()">View ${this.curStudent}'s text</p></td></tr>
				</table>
			</div>
			<div style="flex-grow:6">
				<svg width="100%" height="100%">${this.DrawMoves()}</svg>
			</div>
		</div>
		<div id="sliderLine" class="lz-sliderline"></div>
		<div id="sliderTime" class="lz-slidertime"></div>
		<div id="timeSlider" class="lz-timeslider"></div>
		<img id="playerButton" src="img/playbut.png" style="position:absolute;left:calc(100% - 62px);top:184px;width:18px;cursor:pointer">`;
	
		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body
		$("#lz-feedbar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );		// Don't move orbiter
	
		$("[id^=lzDot-]").on("mouseout",(e)=>{ 	$("#lz-dlg").remove(); });							// Clear move
		$("[id^=lzDot-]").on("mouseover",(e)=>{ 
			let id=e.target.id.substr(6);
			let p=$("#lzDot-"+id).position()
			
			$("#lz-dlg").remove();
			let str=`<div id="lz-dlg" style="position:absolute;top:${p.top+24}px;left:${p.left-4}px">
			<div class='lz-textRA'></div><div class="lz-textR">OK ${this.curStudent}, what is two plus two?</div>
			<div class="lz-textS">Five, of course!</div>
			</div>`;
			$("body").append(str.replace(/\t|\n|\r/g,""))
		});

		$("#timeSlider").slider({																	// Init timeslider
		    max: this.maxTime,																		// Max time in seconds
			create: function(event,ui) {															// On create
				var x=$(this).offset().left-8;														// Start
				},
		   slide: function (event,ui) {																// On slide
			   	let x=$($(this).children('.ui-slider-handle')).offset().left;						// Get pos       			
				_this.ShowNow(ui.value,x);															// Show time																	
				}
		   });

	   $("#playerButton").click(()=> {																// ON PLAY CLICK
			Sound("click");																			// Click sound							
			this.Play();																			// Play	
			});
	}
	
	ShowNow(time, x) 																			// SHOW CURRENT TIME
	{	
		this.curTime=time;																			// Set current position in session
		var min=Math.floor(time/60000);																// Mins
		var sec=Math.floor(time/1000)%60;															// Secs
		if (sec < 10) sec="0"+sec;																	// Add leading 0
		$("#sliderTime").html(min+":"+sec);															// Show value
		$("#sliderLine").css("left",x+2+"px")														// Position line
		$("#sliderTime").css("left",x-8+"px")														// Position text
	}

	DrawMoves()																					// DRAW MOVES CHART
	{
		let x,y=31,i,str="",ys=[];
		let labs=["Think","Correct","Value","Ask","Task"];
		let wid=$(window).width()-350;																// Size of graph
		clearInterval(this.interval);																// Clear timer
		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#999">${(5-i)*100}</text>						
			<line x1="32" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:1"/>
			<text x="${wid+10}" y="${y+4}" fill="#999">${labs[i]}</text>`;							// Draw it
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
			str+=`<circle id="lzDot-${i}" cx="${x*40+45}" cy="${ys[x]}" r="6" fill="#ce7070" cursor="pointer"/>`
			}
		return str
		}	

		ShowText()
		{
			SlideUp(24,34,this.curStudent+"'s text",`This space will show ${this.curStudent}'s written answer to the prompt for reference.`)
		}

		Play() 																						// PLAY/STOP TIMELINE ANIMATION
		{
			clearInterval(this.interval);																// Clear timer
			if ($("#playerButton").prop("src").match(/pausebut/)) 										// If playing, stop
				$("#playerButton").prop("src","img/playbut.png");										// Show play button
			else{																						// If not playing, start
				$("#playerButton").prop("src","img/pausebut.png");										// Show pause button
				this.startPlay=new Date().getTime();													// Set start in sseconds
				let off=(this.curTime-this.curStart)/this.maxTime;			 							// Get offset from start
				this.interval=setInterval(()=> {														// Start timer
					let now=new Date().getTime();														// Get time
					let pct=(now-this.startPlay)/this.maxTime; 											// Get percentage
					pct+=off;																			// Add starting offset
					if (this.curTime > this.maxTime) pct=99;											// Past end point, force quit
					if (pct >= 1) {																		// If done
						this.Play();																	// Stop playing
						this.curStart=this.curTime=0;													// Reset
						}													
					else{																				// If playing
						this.curTime=pct*this.maxTime+this.curStart;									// New time							
						$("#timeSlider").slider("option","value",this.curTime);							// Trigger slider
						var x=$($("#timeSlider").children('.ui-slider-handle')).offset().left;			// Get pos       		
						this.ShowNow(this.curTime,x);													// Show time
						}
					}
				,10);																					// ~5fps
			}
		}
	

}	// Class closure
