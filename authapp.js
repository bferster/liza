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
		this.dd=[];																					// Dialog data
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

	ExportCSV()																					// EXPORT SESSION TO CSV
	{
		let dataStore=(this.tab == "dialog") ? this.dd : this.sd;									// Set where data comes from
		let fields=["type","text","intent","topic","traits","entities"];							// Fields
		let data=Papa.unparse(dataStore,{ header:true, skipEmptyLines:true, columns:fields });		// Make CSV using lib
		let textFileAsBlob=new Blob([data], {type:'text/plain'});									// Get blob
		let downloadLink=document.createElement("a");												// Fake link
		downloadLink.download=((this.tab == "dialog") ? "Dialog-" : "" )+app.sessionId+".csv";		// Filename (add dialog-)
		downloadLink.innerHTML="Download File";														// Fake html														
		downloadLink.href=window.URL.createObjectURL(textFileAsBlob);								// Payload
		downloadLink.style.display="none";															// Hide
		downloadLink.id="tdll";																		// Id
		downloadLink.onclick=()=>{ downloadLink.remove(); };										// On click, remove fake link
		document.body.appendChild(downloadLink);													// Add to DOM
		downloadLink.click();																		// Trigger fake link
	}
	
	ImportCSV(e)																				// IMPORT SESSION FROM CSV
	{	
		let i,k;
		let file=e.target.files[0];																	// Point at file
		if (!file) 	return;																			// Quit if bad
		let dataStore=this.tab == "dialog" ? this.dd : this.sd;										// Set where data goes
		let reader=new FileReader();																// Init reader
		reader.readAsText(file);																	// Read file
		reader.onload=(e)=>{ 																		// When loaded
			dataStore=Papa.parse(e.target.result, { header:true, skipEmptyLines:true }).data;		// Parse CSV using papa lib
			for (i=0;i<dataStore.length;++i)														// For each line
				for (k in dataStore[i]) if (!k) delete dataStore[i][k];								// If empty field, delete it
			if (this.tab == "dialog") 	this.DialogEditor(dataStore);								// Open dialog editor									
			else						$("#jsGridData").jsGrid("option","data",dataStore);			// Load into spreadsheet
			Sound("ding");																			// Ding
			};
		}

	Login()																						// LOGIN
	{
	}
	
	DialogEditor(data)																			// EDIT REMARKS AND RESPONSES
	{
		$("#lz-saveData").css("display","none");
		if (data) this.dd=data;																		// Add data if set
		let i,o,entval="";
		let traits=["Add new trait"],topics=[],entities=["Choose entitity"],intents=["None"],students=["None"];
	
		for (i=0;i<this.sd.length;++i) {															// For each item
			o=this.sd[i];																			// Point at it
			if (o.type == "TRAIT")		  traits.push(o.text);										// Add trait
			else if (o.type == "ENTITY")  entities.push(o.text);									// Add entity
			else if (o.type == "INTENT")  intents.push(o.intent+" - "+o.text);						// Add intent
			else if (o.type == "STUDENT") students.push(o.text);									// Add student
			else if (o.type == "TOPIC")   topics=o.text.replace(/ /g,"").split(",");				// Add topic
			}

		let curItem=0;
		let dd=this.dd[curItem] ? this.dd[curItem] : [];
		let str=`<div class="lz-remarks">
		<p><b><span id="dialogType" style="font-size:32px;vertical-align:-7px;cursor:pointer" 
		title="Click to toggle between REMARK and RESPONSE"></span></b>
		&nbsp;&nbsp;&nbsp;(<span id="dialogCounter">0</span> of ${this.dd.length})</p>
		<table style="width:100%;max-width:1200px;margin:0 auto;text-align:right">
			<tr><td style="float:right;margin-right:-6px"><img id="dialogLeftArrow" src="img/arrowleft.png" class="lz-arrow"></td>
			<td><textarea id="dialogText" type="text" class="lz-mainText"/></td>
			<td><img style="float:left" id="dialogRightArrow" src="img/arrowright.png" class="lz-arrow"></td></tr>
			<tr><td>INTENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogIntent"></select></td><td></td></tr>
			<tr><td>STUDENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogStudent"></select></td><td></td></tr>
			<tr><td>STEP: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogStep"></select></td><td></td></tr>
			<tr><td>TOPIC: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 4px)" id="dialogTopic"></select></td><td></td></tr>
			<tr><td>ENTITIES: &nbsp;</td><td style="text-align:center;border:1px solid #999;border-radius:12px;padding:8px;background-color:#d5e8f3" id="dialogEntities"></td><td></td></tr>
			<tr><td>TRAITS: &nbsp;</td>	<td style="text-align:center;border:1px solid #999;border-radius:12px;padding:8px;background-color:#d5efd2" id="dialogTraits"></td><td></td></tr>
			</table>
		
		<br><div id="dialogTrain" class="lz-bs" style="font-size:20px;padding:4px 24px;background-color:#b72828;display:none"> Save and send to AI to train model </>	
		</div>`;

		$("#dialogEditor").html(str.replace(/\t|\n|\r/g,""));										// Add to div
	
		for (i=0;i<intents.length;++i)																// For each intent
			$("#dialogIntent").append("<option value="+intents[i].split(" - ")[0]+">"+intents[i]+"</option>");	// Add it
		for (i=0;i<students.length;++i)																// For each student
			$("#dialogStudent").append("<option>"+students[i]+"</option>");							// Add it
		$("#dialogTopic").append("<option>None</option>");											// Add null topic
		for (i=0;i<topics.length;++i) 																// For each topic
			$("#dialogTopic").append("<option>"+topics[i]+"</option>");								// Add it
		for (i=1;i<11;++i)																			// For each step
			$("#dialogStep").append("<option>"+i+"</option>");										// Add it

		$("#dialogType").on("click", ()=>{															// ON CLICK OF TYPE
			if (dd.type == "remark") 	dd.type="response";											// Toggle
			else						dd.type="remark"	
			$("#dialogType").text(dd.type.toUpperCase());											// Set label
			Sound("ding");																			// Sound
			dd.changed=true;																		// Item dd.changed	
			});

		$("#dialogLeftArrow").on("click", ()=>{														// ON LEFT ARROW
			curItem=Math.max(--curItem,0);  														// Decrement													  
			dd=this.dd[curItem];																	// Point at current item
			Draw(); 																				// Redraw
			});
		$("#dialogRightArrow").on("click", ()=>{													// ON RIGHT ARROW
			curItem=Math.min(++curItem,this.dd.length-1);  											// Increment
			dd=this.dd[curItem];																	// Point at current item
			Draw(); 																				// Redraw
			});
		
		$("#dialogTrain").on("click", ()=>{															// ON TRAIN
			dd.trained=1;																			// Set trained flag
			dd.changed=false;																		// Reset any changes
			this.ai.AddRemark(dd);																	// Train remark
			Draw();																					// Redraw();
			});
	
		$("#dialogText").on("change keyup paste", ()=>{												// TEXT CHANGE
			if ($("#dialogText").val() == dd.text) return;											// Quit if no change
		 	dd.text=$("#dialogText").val();															// Set new val	
			dd.changed=true; 																		// Item changed
			Draw(); 																				// Redraw
			});	
			
		$("#dialogIntent").on("change", ()=>{ 	dd.intent=$("#dialogIntent").val();		dd.changed=true; Draw(); });	// INTENT CHANGE
		$("#dialogTopic").on("change", ()=>{ 	dd.topic=$("#dialogTopic").val();		dd.changed=true; Draw();});		// TOPIC CHANGE
		$("#dialogStep").on("change", ()=>{ 	dd.step=$("#dialogStep").val();			dd.changed=true; Draw();});		// STEP CHANGE
		$("#dialogStudent").on("change", ()=>{	dd.student=$("#dialogStudent").val();	dd.changed=true; Draw(); });	// STUDENT CHANGE
	
		Draw();																						// Draw dynamic data
		
		function Draw()	{																			// DRAW DYNAMIC DATA
			let str="";
			dd.student=dd.student ? dd.student : "";													// Null	student
			dd.step=dd.step ? dd.step : "";																// Step	
			dd.topic=dd.topic ? dd.topic : "";															// Topic
			$("#dialogType").text(dd.text ? dd.type.toUpperCase() : "Import a dialog file");			// Set type label
			$("#dialogText").val(dd.text ? dd.text : "");												// Set text
			$("#dialogTrain").css("display",((dd.trained != 1) || dd.changed) ? "inline-block" : "none" );	// Show button only if untrained or dd.changed
			let myEntities=dd.entities ? dd.entities.split(",") : [];								// Get entities
			let myTraits=dd.traits ? dd.traits.split(",") : [];										// Make get traits

			$("#dialogIntent").val(dd.intent ? dd.intent : "None" );								// Set intent
			$("#dialogStudent").val(dd.student ? dd.student : "None" );								// Set student
			$("#dialogStep").val(dd.step ? dd.step : "");											// Set step
			$("#dialogTopic").val(dd.topic ? dd.topic : "None");									// Set topic
			$("#dialogCounter").html(curItem+1);													// Set count
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
				if (myTraits[i].match(/topic|step/)) continue;										// Skip step and topic
				str+=`<b>${myTraits[i].split(":")[0].toUpperCase()}</b> : ${myTraits[i].split(":")[1]}
				<img id="traitDelete-${i}" src="img/trashbut.gif" style="cursor:pointer;float:right"><br style="clear:both">`;
				}
			str+=`<select class="lz-is" style="margin-left:8px;width:150px;height:22px;margin-top:8px" id="dialogNewTrait">`
			for (i=0;i<traits.length;++i) 															// For each trait
				if (!traits[i].match(/topic|step/))													// Not a topic or step
					str+="<option>"+traits[i]+"</option>";											// Add trait
			str+=`</select> :<select class="lz-is" style="margin-left:8px;width:150px;height:22px" id="dialogTraitVal">
			</select><img id="addTrait" src="img/addbut.gif" style="cursor:pointer;float:right;margin-top:8px">`;
			$("#dialogTraits").html(str);															// Set traits markup

			$("[id^=entityDelete-]").on("click",(e)=>{												// ON DELETE ENTITY										
				let id=e.target.id.substr(13);														// Get index
				dd.changed=true;																	// Set dd.changed flag
				myEntities.splice(id,1);															// Remove entity
				dd.entities=myEntities.toString();													// Set as a string
				Sound("delete");																	// Sound
				Draw();																				// Redraw();
				});

			$("[id^=traitDelete-]").on("click",(e)=>{												// ON DELETE ENTITY										
				let id=e.target.id.substr(12);														// Get index
				dd.changed=true;																	// Set dd.changed flag
				myTraits.splice(id,1);																// Remove entity
				dd.traits=myTraits.toString();														// Set as a string
				Sound("delete");																	// Sound
				Draw();																				// Redraw;
				});
				
			$("#dialogNewEntity").on("change", ()=>{												// ON ENTITY SELECTED
				$("#dialogNewEntity").css("display","none")											// Hide select
				myEntities.push($("#dialogNewEntity").val()+":"+entval.trim());						// Add entity
				dd.entities=myEntities.toString();													// Set as a string
				dd.changed=true;																		// Set dd.changed flag
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
				dd.traits=myTraits.toString();														// Set as a string
				dd.changed=true;																		// Set dd.changed flag
				Sound("ding");																		// Sound
				$("#dialogTraitVal").empty();
				Draw();																				// Redraw;
				});
					
			$('textarea').mouseup(()=> {															// ON WORD SELECTION
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
