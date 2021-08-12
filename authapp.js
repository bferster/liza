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
		let i,o,entval="",changed=false;
		let traits=["Add new trait"],topics=[],entities=["Choose entitity"],intents=["None"],students=["Whole class"];
		let myEntities=["student:Luis"], myTraits=["Sentiment:POSITIVE"];
		
		for (i=0;i<this.sd.length;++i) {															// For each item
			o=this.sd[i];																			// Point at it
			if (o.type == "TRAIT")		  traits.push(o.text);										// Add trait
			else if (o.type == "ENTITY")  entities.push(o.text);									// Add entity
			else if (o.type == "INTENT")  intents.push(o.intent+" - "+o.text);						// Add intent
			else if (o.type == "STUDENT") students.push(o.text);									// Add student
			else if (o.type == "TOPIC")   topics=o.text.replace(/ /g,"").split(",");				// Add topic
			}

		let text,curItem=0,maxItems=10;
		let str=`<div class="lz-remarks">
		<p><b>${type.toUpperCase()}: <span id="${type}Counter"/> of ${maxItems}</b></p>
		<table style="width:100%;max-width:1200px;margin:0 auto;text-align:right">
			<tr><td style="float:right;margin-right:-6px"><img id="${type}LeftArrow" src="img/arrowleft.png" class="lz-arrow"></td>
			<td><input id="${type}Text" type="text" class="lz-mainText"></td>
			<td><img style="float:left" id="${type}RightArrow" src="img/arrowright.png" class="lz-arrow"></td></tr>
			<tr><td>INTENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 6px)" id="${type}Intent"></select></td><td></td></tr>
			<tr><td>STUDENT: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 6px)" id="${type}Student"></select></td><td></td></tr>
			<tr><td>TOPIC: &nbsp;</td><td><select class="lz-is" style="width:calc(100% + 6px)" id="${type}Topic"></select></td><td></td></tr>
			<tr><td>ENTITIES: &nbsp;</td><td style="text-align:center;border:1px solid #999;border-radius:12px;padding:8px;background-color:#d5e8f3" id="${type}Entities"></td><td></td></tr>
			<tr><td>TRAITS: &nbsp;</td>	<td style="text-align:center;border:1px solid #999;border-radius:12px;padding:8px;background-color:#d5efd2" id="${type}Traits"></td><td></td></tr>
			</table>
		</div>`;

		$("#"+type+"sEditor").html(str.replace(/\t|\n|\r/g,""));									// Add to div
		Draw();																						// Draw dynamic data
	
		for (i=0;i<intents.length;++i)																// For each intent
			$("#"+type+"Intent").append("<option>"+intents[i]+"</option>");							// Add it
		for (i=0;i<students.length;++i)																// For each student
			$("#"+type+"Student").append("<option>"+students[i]+"</option>");						// Add it
		$("#"+type+"Topic").append("<option>None</option>");										// Add null topic
		for (i=0;i<topics.length;++i)																// For each topic
			$("#"+type+"Topic").append("<option>"+topics[i]+"</option>");							// Add it
																									
		$("#"+type+"LeftArrow").on("click", ()=>{													// ON LEFT ARROW
			curItem=Math.max(--curItem,0);  														// Decrement													  
			Draw(); 																				// Redraw
			});
		$("#"+type+"RightArrow").on("click", ()=>{													// ON RIGHT ARROW
			curItem=Math.min(++curItem,maxItems);  													// Increment
			Draw(); 																				// Redraw
			});
		$("#"+type+"Text").on("change", ()=>{ 		changed=true;	});								// TEXT CHANGE
		$("#"+type+"Student").on("change", ()=>{ 	changed=true;	});								// STUDENT CHANGE
		$("#"+type+"Topic").on("change", ()=>{ 		changed=true;	});								// TOPIC CHANGE
		
		function Draw()																				// DRAW DYNAMIC DATA
		{
			let str="";
			text="How did you come up with that answer? "+curItem;									// Get text
			$("#"+type+"Text").val(text);															// Set text
			$("#"+type+"Counter").html(curItem);													// Set count
			for (i=0;i<myEntities.length;++i) {														// For each entity coded
				str+=`<b>${myEntities[i].split(":")[0].toUpperCase()}</b> : ${myEntities[i].split(":")[1]}
				<img id="entityDelete-${i}" src="img/trashbut.gif" style="cursor:pointer;float:right"><br style="clear:both">`;
				}
			str+=`<select class="lz-is" style="margin-left:8px;width:150px;height:22px;display:none" id="${type}NewEntity">`;
			for (i=0;i<entities.length;++i) str+="<option>"+entities[i]+"</option>";				// Add entities
			str+="</select>" 
			$("#"+type+"Entities").html(str);														// Add markup		
			
			str="";
			for (i=0;i<myTraits.length;++i) {														// For each trait coded
				str+=`<b>${myTraits[i].split(":")[0].toUpperCase()}</b> : ${myTraits[i].split(":")[1]}
				<img id="traitDelete-${i}" src="img/trashbut.gif" style="cursor:pointer;float:right"><br style="clear:both">`;
				}
			str+=`<select class="lz-is" style="margin-left:8px;width:150px;height:22px;margin-top:8px" id="${type}NewTrait">`
			for (i=0;i<traits.length;++i) str+="<option>"+traits[i]+"</option>";					// Add traits
			str+=`</select> :<select class="lz-is" style="margin-left:8px;width:150px;height:22px" id="${type}TraitVal">
			</select><img id="addTrait" src="img/addbut.gif" style="cursor:pointer;float:right;margin-top:8px">`;
			$("#"+type+"Traits").html(str);															// Set traits markup

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
				
			$("#"+type+"NewEntity").on("change", ()=>{												// ON ENTITY SELECTED
				$("#"+type+"NewEntity").css("display","none")										// Hide select
				myEntities.push($("#"+type+"NewEntity").val()+":"+entval.trim());					// Add entity
				changed=true;																		// Set changed flag
				Sound("ding");																		// Sound
				Draw();																				// Redraw
				});

			$("#"+type+"NewTrait").on("change", ()=>{												// ON TRAIT SELECTED
				let i,o;
				let trait=$("#"+type+"NewTrait").val();												// Get trait value
				for (i=0;i<app.sd.length;++i) {														// For each item
					o=app.sd[i];																	// Point at it
					if ((o.type == "TRAIT") && (o.text == trait)) {									// Get trait itemm
						$("#"+type+"TraitVal").empty();												// Clear select											
						let v=o.traits.replace(/ /g,"").split(",");									// Extract values					
						for (i=0;i<v.length;++i) $("#"+type+"TraitVal").append("<option>"+v[i]+"</option>");	// Add values
						break;																		// Quit looking
						}
					}
				});

			$("#addTrait").on("click",(e)=>{														// ON ADD TRAIT										
				let val=$("#"+type+"TraitVal").val();												// Get trait value
				myTraits.push($("#"+type+"NewTrait").val()+":"+val);								// Add trait
				changed=true;																		// Set changed flag
				Sound("ding");																		// Sound
				$("#"+type+"TraitVal").empty();
				Draw();																				// Redraw;
				});
					
			$('input').mouseup(()=> {																// ON WORD SELECTION
				if (window.getSelection) 	 entval=window.getSelection().toString();				// Get selction this way
				else if (document.selection) entval=document.selection.createRange().text;			// Or that
				$("#"+type+"NewEntity").css("display","block");										// Hide entity display
				$("#"+type+"NewEntity").val("Choose entitity");										// Reset to top
				});
			}

	}


} // Class closure
