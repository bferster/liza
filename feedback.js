//////////////////////////////////////////////////////////////////////////////////////////////////
// FEEDBACK
/////////////////////////////////////////////////////////////////////////////////////////////////

class Feedback {																				 

	constructor()																				// CONSTRUCTOR
	{
		document.addEventListener( 'mousedown', this.OnClick, false );
		this.curStudent="";																			// No one selected yet
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		this.curStudent="";																			// No one selected yet
//		$("#lz-feedbar").remove();																	// Remove old one
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o.object.name == "body") {																// If a student
			app.fb.curStudent=o.object.parent.name;													// Set name
			app.fb.Draw();																			// Show feedback
		}
	
	}

	Draw()																						// DRAW
	{
		$("#lz-feedbar").remove();																	// Remove old one
		var str=`<div id="lz-feedbar" class="lz-feedbar"> 
		<div class='lz-feedback'>
			<img src="img/closedot.gif" style="cursor:pointer;float:right;margin:4px" onclick='$("#lz-feedbar").remove()'>
			<div style="float:left;margin:4px 16px"> 
				<b style="font-family:Chalk;font-size:48px">${this.curStudent}</b>
				<table style="font-family:Segoe UI,Verdana,Geneva,sans-serif;font-size:13px">
				<tr><td>Academic Language &nbsp;</td><td style="width:120px"><div class="lz-chartbar" style="width:${Math.random()*100}px";</td></tr>
				<tr><td>Prior knowledge</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";</td></tr>
				<tr><td>Use of evidence</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";</td></tr>
				<tr><td>Flexible thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";</td></tr>
				<tr><td>Curious thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";</td></tr>
				<tr><td colspan='2'><p class="lz-bs" id="lz-v${this.curStudent}">View ${this.curStudent}'s text</p></td></tr>
				</table>
			</div>
			<div>
			<img src="img/graph.png">
			</div>
			
		`;





			$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");																			// Add popup to body
			}
	

}	// Class closure
