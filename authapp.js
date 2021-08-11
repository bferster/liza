///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class App  {																					

	constructor()   																			// CONSTRUCTOR
	{
		app=this;																					// App global pointer
		this.ai=new AI();																			// Alloc AI class	
		this.InitSpreadSheet();																		// Init data spreadsheet
		this.sessionId=window.location.search.substring(1); 										// Set id
		this.sd=[];																					// Session data
		this.curRemark=1;																			// Remark being edited	
		this.curResponse=1;																			// Response being edited	
this.sessionId="RER-1";
		this.LoadSession();																			// Load curent session
	}

	InitSpreadSheet()																			// INIT DATA SPREADSHEET
	{
		this.pFields=[{ name:"type", type:"text", width:25, validate:"required"},					// CSV fields
			{ name:"text", type:"text", width:100 },
			{ name:"intent", type:"text", width:25 },
			{ name:"topic", type:"text", width:25},
			{ name:"traits", type:"text",width:50 },
			{ name:"entities", type:"text",width:50 },
			{ type:"control", width:0  }];

		$("#jsGridData").jsGrid({ width:"100%", height:"calc(100vh - 168px)",						// Init JSGrid
				inserting:true, editing:true, sorting:true,
				fields: this.pFields, data:[],
				});
		$("#jsGridData").css("padding",0)		
	}

	LoadSession(callback)																		// LOAD SESSION DATA
	{
		let url="https://viseyes.org/liza/config/loadsession.php?f="+this.sessionId+".json";		// Point at script
		$.ajax({ url:url }).done((d)=> { 															// Load file
			if (d) 			this.sd=JSON.parse(d);													// Objectify
			$("#jsGridData").jsGrid("option","data",this.sd);										// Load into spreadsheet
			if  (callback) 	callback() ;															// Run callback if set	
			});		
	}

	SaveSession()																				// SAVE SESSION DATA
	{
		let url="https://viseyes.org/liza/config/savesession.php?f="+this.sessionId+".json";		// Point at script
		this.sd=$("#jsGridData").jsGrid("option","data");											// Pull current state of data from spreadsheet
		let data={ s:JSON.stringify(this.sd) };														// Stringify
		$.ajax({ url:url, type: "POST", method:'POST', data:data })									// Write to file	
			.done((s)=>{ 																			// Done
				if (s == 0)	Sound("delete"),PopUp("Error saving session!");							// Send error 
			 	else		Sound("ding"); 															// Success
				app.ai.Train();																		// Train AI
				})		
	}

	ExportSession()																				// EXPORT SESSION TO CSV
	{
		let fields=["type","text","intent","topic","traits","entities"];							// Fields
		let data=Papa.unparse(this.sd,{ header:true, skipEmptyLines:true, columns:fields });		// Make CSV using lib
		let textFileAsBlob=new Blob([data], {type:'text/plain'});									// Get blob
		let downloadLink=document.createElement("a");												// Fake link
		downloadLink.download=app.sessionId+".csv";													// Filename
		downloadLink.innerHTML="Download File";														// Fake html														
		downloadLink.href=window.URL.createObjectURL(textFileAsBlob);								// Payload
		downloadLink.style.display="none";															// Hide
		downloadLink.id="tdll";																		// Id
		downloadLink.onclick=()=>{ downloadLink.remove(); };										// On click, remove fake link
		document.body.appendChild(downloadLink);													// Add to DOM
		downloadLink.click();																		// Trigger fake link
	}
	
	ImportSession(e)																			// IMPORT SESSION FROM CSV
	{	
		let i,k;
		let file=e.target.files[0];																	// Point at file
		if (!file) 	return;																			// Quit if bad
		let reader=new FileReader();																// Init reader
		reader.readAsText(file);																	// Read file
		reader.onload=(e)=>{ 																		// When loaded
			this.sd=Papa.parse(e.target.result, { header:true, skipEmptyLines:true }).data;			// Parse CSV using papa lib
			for (i=0;i<this.sd.length;++i)															// For each line
				for (k in this.sd[i]) if (!k) delete this.sd[i][k];									// If empty field, delete it
			$("#jsGridData").jsGrid("option","data",this.sd);										// Load into spreadsheet
			Sound("ding");																			// Ding
			};
		}

	Login()																						// LOGIN
	{
	}
	
	RemarksEditor(type)																			// EDIT REMARKS AND RESPONSES
	{
		let text,curItem=0,maxItems=10;
		let str=`<div class="lz-remarks">
		<p>${type.toUpperCase()}: <span id="${type}Counter"/></b></p>
		<table style="width:50%;max-width:800px;margin:0 auto;text-align:right">
			<tr><td style="float:right;margin-right:-6px"><img id="${type}LeftArrow" src="img/arrowleft.png" class="lz-arrow"></td>
			<td><input id="${type}Text" type="text" class="lz-mainText"></td>
			<td><img style="float:left" id="${type}RightArrow" src="img/arrowright.png" class="lz-arrow"></td></tr>
			<tr><td>INTENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 6px)" id="${type}Intent"></select></td><td></td></tr>
			<tr><td>TOPIC: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 6px)" id="${type}Topic"></select></td><td></td></tr>
			<tr><td>ENTITIES: &nbsp;</td><td style="text-align:center;border:1px solid #999;border-radius:12px" id="${type}Entities"></td><td></td></tr>
				<tr><td>TRAITS: &nbsp;</td><td style="text-align:center;border:1px solid #999;border-radius:12px" id="${type}Traits"></td><td></td></tr>

			</table>
		</div>`;
		$("#"+type+"sEditor").html(str.replace(/\t|\n|\r/g,""));									// Add to div
		Draw();																						// Draw dynamic data
	
		$("#"+type+"Intent").append("<option>None</option>");
		$("#"+type+"Intent").append("<option>110.1 Giving feeedback to student</option>");
																									
		$("#"+type+"LeftArrow").on("click", ()=>{													// ON LEFT ARROW
			curItem=Math.max(--curItem,0);  														// Decrement													  
			Draw(); 																				// Redraw
			});
		$("#"+type+"RightArrow").on("click", ()=>{													// ON RIGHT ARROW
			curItem=Math.min(++curItem,maxItems);  													// Increment
			Draw(); 																				// Redraw
			});

		function Draw()																				// DRAW DYNAMIC DATA
		{
			text="How did you come up with that answer? "+curItem;									// Get text
			$("#"+type+"Text").val(text);															// Set text
			$("#"+type+"Counter").html(curItem);													// Set count
			let str="<b>STUDENT</b>: Luis<span style='float:right'>x&nbsp;</span>"	
			$("#"+type+"Entities").html(str)		
			str="<b>SENTIMENT</b>: POSITIVE";	
		
			$("#"+type+"Traits").html(str)		
		}

	}


} // Class closure
