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
	
	DialogEditor()																			// EDIT REMARKS AND RESPONSES
	{
		$("#lz-saveData").css("display","none");
		let i,o,entval="",changed=false;
		let traits=["Add new trait"],topics=[],entities=["Choose entitity"],intents=["None"],students=["All"];
		let myEntities=["student:Luis"], myTraits=["Sentiment:POSITIVE"];
		
		for (i=0;i<this.sd.length;++i) {															// For each item
			o=this.sd[i];																			// Point at it
			if (o.type == "TRAIT")		  traits.push(o.text);										// Add trait
			else if (o.type == "ENTITY")  entities.push(o.text);									// Add entity
			else if (o.type == "INTENT")  intents.push(o.intent+" - "+o.text);						// Add intent
			else if (o.type == "STUDENT") students.push(o.text);									// Add student
			else if (o.type == "TOPIC")   topics=o.text.replace(/ /g,"").split(",");				// Add topic
			}

		let type="remark";
		let text,curItem=0,maxItems=10;
		let str=`<div class="lz-remarks">
		<p><b><span id="dialogType" style="font-size:32px;vertical-align:-7px;cursor:pointer" 
		title="Click to toggle between REMARK and RESPONSE">${type.toUpperCase()}</span></b>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(<span id="dialogCounter"/> of ${maxItems})</p>
		<table style="width:100%;max-width:1200px;margin:0 auto;text-align:right">
			<tr><td style="float:right;margin-right:-6px"><img id="dialogLeftArrow" src="img/arrowleft.png" class="lz-arrow"></td>
			<td><input id="dialogText" type="text" class="lz-mainText"></td>
			<td><img style="float:left" id="dialogRightArrow" src="img/arrowright.png" class="lz-arrow"></td></tr>
			<tr><td>INTENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogIntent"></select></td><td></td></tr>
			<tr><td>STUDENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogStudent"></select></td><td></td></tr>
			<tr><td>STEP: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogStep"></select></td><td></td></tr>
			<tr><td>TOPIC: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogTopic"></select></td><td></td></tr>
			<tr><td>ENTITIES: &nbsp;</td><td style="text-align:center;border:1px solid #999;border-radius:12px;padding:8px;background-color:#d5e8f3" id="dialogEntities"></td><td></td></tr>
			<tr><td>TRAITS: &nbsp;</td>	<td style="text-align:center;border:1px solid #999;border-radius:12px;padding:8px;background-color:#d5efd2" id="dialogTraits"></td><td></td></tr>
			</table>
		</div>`;

		$("#dialogEditor").html(str.replace(/\t|\n|\r/g,""));										// Add to div
		Draw();																						// Draw dynamic data
	
		for (i=0;i<intents.length;++i)																// For each intent
			$("#dialogIntent").append("<option>"+intents[i]+"</option>");							// Add it
		for (i=0;i<students.length;++i)																// For each student
			$("#dialogStudent").append("<option>"+students[i]+"</option>");							// Add it
		$("#dialogTopic").append("<option>None</option>");											// Add null topic
		for (i=0;i<topics.length;++i)																// For each topic
			$("#dialogTopic").append("<option>"+topics[i]+"</option>");								// Add it
		for (i=1;i<11;++i)																			// For each step
			$("#dialogStep").append("<option>"+i+"</option>");										// Add it

		$("#dialogType").on("click", ()=>{															// ON CLICK OF TYPE
			if (type == "remark") 	type="response";												// Toggle
			else					type="remark"	
			$("#dialogType").text(type.toUpperCase());												// Set label
			Sound("ding");																			// Sound
			changed=true;																			// Item changed	
			});

		$("#dialogLeftArrow").on("click", ()=>{														// ON LEFT ARROW
			curItem=Math.max(--curItem,0);  														// Decrement													  
			Draw(); 																				// Redraw
			});
		$("#dialogRightArrow").on("click", ()=>{													// ON RIGHT ARROW
			curItem=Math.min(++curItem,maxItems);  													// Increment
			Draw(); 																				// Redraw
			});
		$("#dialogText").on("change", ()=>{ 		changed=true;	});								// TEXT CHANGE
		$("#dialogStudent").on("change", ()=>{ 		changed=true;	});								// STUDENT CHANGE
		$("#dialogTopic").on("change", ()=>{ 		changed=true;	});								// TOPIC CHANGE
		$("#dialogStep").on("change", ()=>{ 		changed=true;	});								// STEP CHANGE
		
		function Draw()																				// DRAW DYNAMIC DATA
		{
			let str="";
			text="How did you come up with that answer? "+curItem;									// Get text
			$("#dialogText").val(text);																// Set text
			$("#dialogCounter").html(curItem);														// Set count
			for (i=0;i<myEntities.length;++i) {														// For each entity coded
				str+=`<b>${myEntities[i].split(":")[0].toUpperCase()}</b> : ${myEntities[i].split(":")[1]}
				<img id="entityDelete-${i}" src="img/trashbut.gif" style="cursor:pointer;float:right"><br style="clear:both">`;
				}
			str+=`<select class="lz-is" style="margin-left:8px;width:150px;height:22px;display:none" id="dialogNewEntity">`;
			for (i=0;i<entities.length;++i) str+="<option>"+entities[i]+"</option>";				// Add entities
			str+="</select>" 
			$("#dialogEntities").html(str);															// Add markup		
			
			str="";
			for (i=0;i<myTraits.length;++i) {														// For each trait coded
				str+=`<b>${myTraits[i].split(":")[0].toUpperCase()}</b> : ${myTraits[i].split(":")[1]}
				<img id="traitDelete-${i}" src="img/trashbut.gif" style="cursor:pointer;float:right"><br style="clear:both">`;
				}
			str+=`<select class="lz-is" style="margin-left:8px;width:150px;height:22px;margin-top:8px" id="dialogNewTrait">`
			for (i=0;i<traits.length;++i) str+="<option>"+traits[i]+"</option>";					// Add traits
			str+=`</select> :<select class="lz-is" style="margin-left:8px;width:150px;height:22px" id="dialogTraitVal">
			</select><img id="addTrait" src="img/addbut.gif" style="cursor:pointer;float:right;margin-top:8px">`;
			$("#dialogTraits").html(str);															// Set traits markup

			$("[id^=entityDelete-]").on("click",(e)=>{												// ON DELETE ENTITY										
				let id=e.target.id.substr(13);														// Get index
				changed=true;																		// Set changed flag
				myEntities.splice(id,1);															// Remove entity
				Sound("delete");																	// Sound
				Draw();																				// Redraw();
				});

			$("[id^=traitDelete-]").on("click",(e)=>{												// ON DELETE ENTITY										
				let id=e.target.id.substr(12);														// Get index
				changed=true;																		// Set changed flag
				myTraits.splice(id,1);																// Remove entity
				Sound("delete");																	// Sound
				Draw();																				// Redraw;
				});
				
			$("#dialogNewEntity").on("change", ()=>{												// ON ENTITY SELECTED
				$("#dialogNewEntity").css("display","none")											// Hide select
				myEntities.push($("#dialogNewEntity").val()+":"+entval.trim());						// Add entity
				changed=true;																		// Set changed flag
				Sound("ding");																		// Sound
				Draw();																				// Redraw
				});

			$("#dialogNewTrait").on("change", ()=>{													// ON TRAIT SELECTED
				let i,o;
				let trait=$("#dialogNewTrait").val();												// Get trait value
				for (i=0;i<app.sd.length;++i) {														// For each item
					o=app.sd[i];																	// Point at it
					if ((o.type == "TRAIT") && (o.text == trait)) {									// Get trait itemm
						$("#dialogTraitVal").empty();												// Clear select											
						let v=o.traits.replace(/ /g,"").split(",");									// Extract values					
						for (i=0;i<v.length;++i) $("#dialogTraitVal").append("<option>"+v[i]+"</option>");	// Add values
						break;																		// Quit looking
						}
					}
				});

			$("#addTrait").on("click",(e)=>{														// ON ADD TRAIT										
				let val=$("#dialogTraitVal").val();													// Get trait value
				myTraits.push($("#dialogNewTrait").val()+":"+val);									// Add trait
				changed=true;																		// Set changed flag
				Sound("ding");																		// Sound
				$("#dialogTraitVal").empty();
				Draw();																				// Redraw;
				});
					
			$('input').mouseup(()=> {																// ON WORD SELECTION
				if (window.getSelection) 	 entval=window.getSelection().toString();				// Get selction this way
				else if (document.selection) entval=document.selection.createRange().text;			// Or that
				$("#dialogNewEntity").css("display","block");										// Hide entity display
				$("#dialogNewEntity").val("Choose entitity");										// Reset to top
				});
			}

	}

	SettingsEditor()
	{
		$("#lz-saveData").css("display","none");
	}

} // Class closure
