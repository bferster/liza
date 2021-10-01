///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3D SYSTEM
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Scene {																				 

	constructor(div)																			// CONSTRUCTOR
	{
		this.seats=[ { x: 120, y:100,  z:0, r:0 },   { x:  0,  y:100,  z:0, r:0   },				// Seat locations
					 { x:-120, y:100,  z:0, r:-10 }, { x:-120, y:-100, z:0, r:0 },
					 { x:   0, y:-100, z:0, r:0 },   { x: 120, y:-100, z:0, r:30  } ];

		if (app.horseshoe)																			// Horseshoe seating
					 this.seats=[ { x: 200, y:110,  z:0, r:-25 },													
			   		 { x: 100, y:70,   z:0, r:-15 },				
					 { x:0,    y:50,   z:0, r:0 },
					 { x:-100, y:75,   z:0, r:15 },
					 { x:-200, y:110,  z:0, r:25 },
					 { x: -200, y:-100, z:0, r:0 },   
					 { x: -100, y:-100, z:0, r:0 },   
					 { x:   0, y:-100, z:0, r:0 },   
					 { x: 100, y:-100, z:0, r:0 },   
					 { x: 200, y:-100, z:0, r:30 } ];

		this.lastTime=0;																			// Used to throttle rendring
		this.cartoonScene=window.location.search.match(/real/i) ? false : true;						// Render scene as cartoon?	   		
		this.models=[];																				// Holds models
		this.container=$("#"+div)[0];																// Div container														
		this.camera=null;																			// Camera object
		this.renderer=null;																			// Renderer object
		this.scene=null;																			// Scene object
		this.controls=null;																			// Controls object
		this.outliner=null;																			// Outline renderer
		this.floor="assets/wood.jpg";																// Floor texture
		this.backWall="assets/blackboard.png";														// Back wall texture
		this.frontWall=this.cartoonScene ? "" : "assets/blackboard.png";							// Front wall texture
		this.leftWall= this.cartoonScene ? "" : "assets/windowwall.png";							// Side wall texture
		this.rightWall=this.cartoonScene ? "" : "assets/windowwall.png";							// Side wall texture
		this.aniTimer=0;																			// Timer for talking and fidgeting
		this.Init();																				// Init 3D system
	}

	Init()																						// INIT 3D SYSTEM
	{
		this.scene=new THREE.Scene();																// Alloc new scene
		if (this.cartoonScene) 	this.scene.background=new THREE.Color(0xffffff);					// White background
		this.manager=new THREE.LoadingManager();													// Loading manager
		this.textureLoader=new THREE.TextureLoader();												// Texture loader
		this.AddCamera(0,150,500,.4);																// Add camera
		this.controls.addEventListener('end',(e)=> {												// On control change
			app.arc.Add( {o:'O',																	// Add to record
				xr:this.camera.rotation.x, yr:this.camera.rotation.y, zr:this.camera.rotation.z,	// Rotation
				x:this.camera.position.x,  y:this.camera.position.y,  z:this.camera.position.z});	// Position
				});
		this.renderer=new THREE.WebGLRenderer({ antialias: true });									// Init renderer
		this.renderer.setPixelRatio(window.devicePixelRatio);										// Set ratio
		this.AddLights();																			// Add lights
		this.Resize();																				// Resize 3D space
		this.container.appendChild(this.renderer.domElement);										// Add to div
		this.AddRoom();																				// Add room walls
		this.AddBlackboards();																		// Add blackboards
		this.raycaster=new THREE.Raycaster(); 														// Alloc raycaster
		this.mouse=new THREE.Vector2(); 															// Alloc click holder
	}

	AddLights()																					// ADD LIGHTS
	{
		var light=new THREE.DirectionalLight("#222222");											// Made directional light
		light.position.set(0,0,1);																	// Set angle
		this.scene.add(light);																		// Add directioal light
		this.scene.add(new THREE.AmbientLight(0xffffff, 1));										// Add ambient light
		this.outliner=new THREE.OutlineEffect(this.renderer, { /*defaultThickness:.0035 */ });		// Add outliner
	}

	Resize()																					// RESIZE 3D SPACE
	{
		this.camera.aspect=window.innerWidth/window.innerHeight;									// Set aspect
		this.camera.updateProjectionMatrix();														// Reset matrix
		if (this.scene && this.scene.outliner) 	this.outliner.setSize(window.innerWidth,window.innerHeight-3);	// Reset render size		
		else if (this.scene)					this.renderer.setSize(window.innerWidth,window.innerHeight-3);	
	}

	AddCamera(x, y, z)																			// ADD CAMERA
	{
		this.camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,1,2000);	// Add 45 degree POV
		this.scene.add(this.camera);																// Add camera to scene
		this.SetCamera(x,y,z,0,0,0);																// Position camera
		this.controls=new THREE.OrbitControls(this.camera);											// Add orbiter control
		this.controls.damping=0.2;																	// Set dampening
	}

	SetCamera(x, y, z, xr, yr, zr)																	// SET CAMERA
	{
		this.camera.position.x=x;	this.camera.position.y=y;	this.camera.position.z=z;			// Camera position
		this.camera.rotation.x=xr;	this.camera.rotation.y=yr;	this.camera.rotation.z=zr;			// Rotation
	}

	AddRoom()																					// ADD ROOM TO SCENE
	{	
		var _this=this;																				// Save context
		if (this.floor) 		addWall(0,0,0,-Math.PI/2,0,0,1024,this.floor,1,this.cartoonScene);	// If a floor spec'd
		if (this.frontWall) 	addWall(0,128,512,0,Math.PI,0,256,this.frontWall,0,0);				// If a front wall spec'd
		if (this.backWall) 		addWall(0,128,-512,0,0,0,256,this.backWall,0,0);					// If a back wall spec'd
		if (this.leftWall) 		addWall(-512,128,0,0,Math.PI/2,0,256,this.leftWall,0,0);			// If a left wall spec'd
		if (this.rightWall)	 	addWall(512,128,0,0,-Math.PI/2,0,256,this.rightWall,0,0);			// If a right wall spec'd

		function addWall(x, y, z, xr, yr, zr, h, texture, wrap, cartoon) {							// ADD WALL
			var mat=new THREE.MeshPhongMaterial();													// Make material
			mat.color=new THREE.Color(cartoon ? 0xeeeeee : 0xffffff);								// Set color
			if (!cartoon) {																			// If a cartoon scene
				mat.userData.outlineParameters= { visible: false };									// Hide outline
				var tex=_this.textureLoader.load(texture);											// Load texture
				if (wrap) {																			// If wrapping
					tex.wrapS=tex.wrapT=THREE.RepeatWrapping;										// Wrap and repeat
					tex.repeat.set(4,4);															// 4 by 4
					}
				mat.map=tex;																		// Add texture
				}
			var cbg=new THREE.PlaneGeometry(1024,h,1,1);											// Make grid
			var mesh=new THREE.Mesh(cbg,mat);														// Make mesh
			mesh.rotation.x=xr;		mesh.rotation.y=yr;		mesh.rotation.z=zr;						// Rotate 
			mesh.position.x=x; 		mesh.position.y=y;		mesh.position.z=z;						// Position
			_this.scene.add(mesh);																	// Add to scene		
		}
	}

	AddBlackboards()																			// ADD BLACKBOARDS TO WALL
	{
		var mat=new THREE.MeshPhongMaterial();														// Make material
		var cbg=new THREE.PlaneGeometry(256,128,1);													// Make grid
		var mesh=new THREE.Mesh(cbg,mat);															// Make mesh
		app.bb.texMap[0]=mat.map=new THREE.CanvasTexture($("#blackboardCan-0")[0]);					// Left blackboard
		mesh.position.x=-200; 		mesh.position.y=150;		mesh.position.z=-511;				// Position
		this.scene.add(mesh);																		// Add to scene		
		mat=new THREE.MeshPhongMaterial();															// Make material
		cbg=new THREE.PlaneGeometry(256,128,1);														// Make grid
		mesh=new THREE.Mesh(cbg,mat);																// Make mesh
		app.bb.texMap[1]=mat.map=new THREE.CanvasTexture($("#blackboardCan-1")[0]);					// Left blackboard
		mesh.position.x=200; 		mesh.position.y=150;		mesh.position.z=-511;				// Position
		this.scene.add(mesh);																		// Add to scene		
	
		app.clockHand=new THREE.Group();															// Clock hand group
		mat=new THREE.MeshPhongMaterial();															// Make material for clock hand
		mat.color=new THREE.Color(0x333333);														// Set color
		cbg=new THREE.PlaneGeometry(18,2,1);														// Make grid
		mesh=new THREE.Mesh(cbg,mat);																// Make mesh
		mesh.position.x=9;																			// Spin by left end
		app.clockHand.add(mesh);																	// Add line
		app.clockHand.position.x=1; app.clockHand.position.y=180;	app.clockHand.position.z=-510;	// Position
		this.scene.add(app.clockHand);																// Add to scene		
	}

	SetClock(degree)																			// SET CLOCK ANGLE
	{
		app.clockHand.rotation.z=((degree-90)%360)*Math.PI/-180;									// Rotate hand
	}

	AddModel(o)																					// ADD MODEL TO SCENE
	{
		var loader;
		var _this=this;																				// Save context
		if (o.src.match(/\.json/i))	loader=new THREE.ObjectLoader(this.manager);					// If JSON model format
		if (o.src.match(/\.obj/i))	loader=new THREE.OBJLoader(this.manager);						// If OBJ
		if (o.src.match(/\.gltf/i))	loader=new THREE.GLTFLoader(this.manager);						// If GLTF
		if (o.src.match(/\.dae/i))	loader=new THREE.ColladaLoader(this.manager);					// If DAE

		loader.load(o.src, (obj)=> { 																// Load model
			loadModel(obj);																			// Load it
			if (o.sex) 				_this.SetPose(o.id,"startUp");									// If a student set starting pose
			}, onProgress, onError );																// Load

		function onProgress(xhr) {}																	// ON PROGRESS

		function onError(err) {	console.log(err) };													// ON ERROR

		function loadModel(object) {															// ON LOAD
			var texture=null;
			if (object.scene)	object=object.scene;												// Point at scene if there (GLTF/DAE)			
			_this.models[o.id]=({ name:o.src, bones:[], model: object });							// Add new model	
			var cm=_this.models[o.id];																// Point at new model
			if (o.tex && isNaN(o.tex)) 																// If a texture
				texture=_this.textureLoader.load(o.tex);											// Load it

			object.traverse(function(child) {														// Go thru model
				if (child.isBone) {																	// If a bone,
					cm.bones[child.name]=child; 													// Add to list
					child.oxr=child.rotation.x;														// Save original x rotation
					child.oyr=child.rotation.y;														// Y
					child.ozr=child.rotation.z;														// Z
					}
				if (child.isMesh) { 																// If a mesh
					if (texture)		child.material.map=texture;									// If has texture, add it
					if (!isNaN(o.tex)) 																// If a cartoon shading
						child.material.color=new THREE.Color(o.tex);								// Set color
					if (child.material.userData)													// If user data
						child.material.userData.outlineParameters= { visible:true }; 				// Outline if cartoon
					}							
			});
			
			var loc=_this.seats[o.seat];															// Get location
			object.oxp=loc.x;		object.ozp=loc.y;		object.oyp=loc.z;	object.orp=loc.r;	// Save start pos's
			object.scale.x=object.scale.y=object.scale.z=o.s;										// Scale 
			object.position.x=loc.x;	object.position.z=loc.y;	object.position.y=loc.z;		// Position
			object.rotation.z=loc.r*Math.PI/180;													// Rotation
			object.name=o.id;																		// Set name
			if (o.sex) object.position.z-=12,object.ozp-=12;
			_this.scene.add(object);																// Add model to scene
		}
	}

	SetBone(model, bone, x, y, z)																// ROTATE A BONE
	{
		if (!this.models[model] || !this.models[model].bones[bone])	return;							// Quit on bad model or bone
		if (bone == "base") {																		// X and Z axes set model positon directly, not via the bone
			this.models[model].model.position.x=x-0+this.models[model].model.oxp+1.5;				// Set base X position via model (fudge)
			this.models[model].model.position.z=z-0+this.models[model].model.ozp;					// Z
			x=z=0;
			}
		x*=Math.PI/180;	y*=Math.PI/180;	z*=Math.PI/180;												// Convert degrees to radians
		x+=this.models[model].bones[bone].oxr;														// Add initial rotations
		y+=this.models[model].bones[bone].oyr;
		z+=this.models[model].bones[bone].ozr;
		this.models[model].bones[bone].rotation.x=x;												// Rotate 						
		this.models[model].bones[bone].rotation.y=y;													
		this.models[model].bones[bone].rotation.z=z;													
	}

// POSES ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	SetPose(model, id)																			// SET A POSE FOR A MODEL
	{
		var i;
		var v=app.poses[id];																		// Get pose string
		if (!v || !model)	return;																	// Quit if no string or model
		v=v.split(",");																				// Get bone positions
		for (i=0;i<v.length;i+=4)																	// Stride by 4
			this.SetBone(model,v[i],v[i+1]-0,v[i+2]-0,v[i+3]-0);									// Set bone
		var angle=(this.models[model].bones["thighL"].rotation.x-this.models[model].bones["thighL"].oxr)*180/Math.PI;	// Angle of left thigh in degress
		this.models[model].bones["base"].position.z=angle/40;										// Left thigh controls height for sitting									
		}

	PoseEditor()																				// POSE EDITOR
	{
		var _this=this;
		if ($("#poseEditor").length) {																// If already up, bring it down
			$("#poseEditor").hide("slide",{ direction:"down", complete: ()=>{ $("#poseEditor").remove(); } }); // Slide down
			return;																					// Quit																					
			}
		var str="<div id='poseEditor' class='lz-dialog' style='display:none'>";
		str+="<img src='img/lizalogo.png' style='vertical-align:-6px' width='64'><span style='font-size:18px;margin-left:8px'>pose editor</span>";	
		str+="<img src='img/closedot.gif' style='float:right' onclick='$(\"#poseEditor\").remove();'><br><br>";
		str+="<table>";
		str+="<tr><td>Student: </td><td>"+MakeSelect("beModel",false,[]);									// Model id
		str+="&nbsp;&nbsp;&nbsp;Pose:&nbsp;"+MakeSelect("bePose",false,[]);									// Pose
		str+="&nbsp;&nbsp;&nbsp;Bone:&nbsp;"+MakeSelect("beBone",false,[]);									// Bone
		str+="<div class='lz-bs' id='beZero' style='float:right;margin-right:12px'>0</div></td></tr>";		// Bone id/zero
		str+="<tr><td>&nbsp;</td></tr>";
		str+="<tr><td>X&nbsp;axis&nbsp;&nbsp;</td><td><input type='range' min=-180 max=180 value=0 style='width:470px' id='beXaxis'>"					// X slider
		str+="&nbsp;&nbsp;<input type='text' class='lz-is' id='beXval' value=0 style='width:30px;vertical-align:6px;text-align:center'></td></tr>";		// X slider value
		str+="<tr><td>Y&nbsp;axis&nbsp;&nbsp;</td><td><input type='range' min=-180 max=180 value=0 style='width:470px' id='beYaxis'>"					// Y
		str+="&nbsp;&nbsp;<input type='text' class='lz-is' id='beYval' value=0 style='width:30px;vertical-align:6px;text-align:center'></td></tr>";		// Y
		str+="<tr><td>Z&nbsp;axis&nbsp;&nbsp;</td><td><input type='range' min=-180 max=180 value=0 style='width:470px' id='beZaxis'>"					// Z
		str+="&nbsp;&nbsp;<input type='text' class='lz-is' id='beZval' value=0 style='width:30px;vertical-align:6px;text-align:center'></td></tr>";		// Z
	
		str+="</table><br>";																			
		str+="Sequence:&nbsp;"+MakeSelect("beSeqs",false,[]);																			
		str+="&nbsp;&nbsp;&nbsp;Fidget?&nbsp;<td><input type='checkbox' id='beFidget'"+(app.students[app.curStudent].fidget ? " checked" : "")+">" ;																			
		str+="<div class='lz-bs' id='beReset' style='float:right;margin-right:4px'>Reset</div>";																		
		str+="</div>";

		$("body").append(str);																		// Add to body
		var h=window.innerHeight-$("#poseEditor").height()-88;										// Calc top
		$("#poseEditor").css("top",h+"px");															// Set top
		$("#poseEditor").show("slide",{ direction:"down"});											// Bring up	
		addModels();																				// Load models for pulldown
		addBones();																					// Load bones for pulldown
		addPoses();																					// Load poses for pulldown
		addSeqs();																					// Load sequences for pulldown
		if (!isMobile)	$("#poseEditor").draggable();												// Make it draggable on desktop

		$("#poseEditor").on("mousedown touchdown", (e)=> { e.stopPropagation();  } );				// Don't move orbiter
		$("#poseEditor").on("touchmove", (e)=> { e.stopPropagation();  } );							// Don't move orbiter
		$("#beXaxis").on("input",  function(e) { $("#beXval").val(this.value); moveBone(); } );		// Show x value	
		$("#beXval").on("change",  function(e) { $("#beXaxis").val(this.value); moveBone(); } );	// Set x value manually	
		$("#beYaxis").on("input",  function(e) { $("#beYval").val(this.value); moveBone(); } );		// Y
		$("#beYval").on("change",  function(e) { $("#beYaxis").val(this.value); moveBone(); } );	// Y	
		$("#beZaxis").on("input",  function(e) { $("#beZval").val(this.value); moveBone(); } );		// Z
		$("#beZval").on("change",  function(e) { $("#beZaxis").val(this.value); moveBone(); } );	// Z
		$("#beFidget").on("click", function(e) { app.students[app.curStudent].fidget=$(this).prop("checked") ? 1 : 0 });		// Toggle fidget flag
	
		$("#beModel").on("change", function(e) { 													// Change model
			for (var i=0;i<app.students.length;++i) 
				if ($(this).val() == app.students[i].id)	app.curStudent=i;						// Make it current student	
			});
		
		$("#bePose").on("change", function(e) { 													// Add new pose
			app.sc.SetPose($("#beModel").val(),this.value);											// Show new pose							
			$("#beXval").val(0);	$("#beYval").val(0);	$("#beZval").val(0);					// Set indicator
			$("#beXaxis").val(0);	$("#beYaxis").val(0);	$("#beZaxis").val(0);					// Set slider
			$("#bePose").prop("selectedIndex",0);													// Reset pulldown
			$("#beBone").trigger("change"); 														// Force bone to update
			});
			
		$("#beBone").on("change",  function(e) {
			var v;
			var model=$("#beModel").val();															// Model id
			var bone=$("#beBone").val();															// Bone id
			if (bone == "Choose bone")	return;														// Quit on no bone
			v=(Math.round((_this.models[model].bones[bone].rotation.x-_this.models[model].bones[bone].oxr)*180/Math.PI)*100)/100;	// Get X degrees
			$("#beXval").val(v);	$("#beXaxis").val(v);											// Set slider
			v=(Math.round((_this.models[model].bones[bone].rotation.y-_this.models[model].bones[bone].oyr)*180/Math.PI)*100)/100;	// Get Y degrees
			$("#beYval").val(v);	$("#beYaxis").val(v);											// Set slider
			v=(Math.round((_this.models[model].bones[bone].rotation.z-_this.models[model].bones[bone].ozr)*180/Math.PI)*100)/100;	// Get Z degrees
			$("#beZval").val(v);	$("#beZaxis").val(v);											// Set slider
			});

		$("#beZero").on("click", ()=>  {															// ZERO BONE TO ORIGINAL STATE	
			$("#beXval").val(0);	$("#beYval").val(0);	$("#beZval").val(0);					// Set indicator
			$("#beXaxis").val(0);	$("#beYaxis").val(0);	$("#beZaxis").val(0);					// Set slider
			this.SetBone($("#beModel").val(),$("#beBone").val(),0,0,0);								// Set bone						
			});

		$("#beSeqs").on("change", ()=>  {															// RUN SEQUENCE
			this.StartAnimation($("#beModel").val(),app.seqs[$("#beSeqs").val()]);					// Start animating
			if ($("#beSeqs").val() == "talk")	app.voice.Talk("My name is Liza. How are you today? Would you like to play a game?");
			$("#beSeqs").prop("selectedIndex",0);		$("#beBone").prop("selectedIndex",0);		// Reset pulldowns
			});
		
		$("#beReset").on("click", ()=>  {															// REST ALL BONES TO ORIGINAL STATE	
			$("#beXval").val(0);	$("#beYval").val(0);	$("#beZval").val(0);					// Set indicator
			$("#beXaxis").val(0);	$("#beYaxis").val(0);	$("#beZaxis").val(0);					// Set slider
			var base=this.models[$("#beModel").val()].bones;										// Point at bones array
			for (var bone in base) 	this.SetBone($("#beModel").val(),bone,0,0,0);					// Set bone						
			});

		function addModels() {																		// FILL MODELS PULLDOWN
			var i, v=[];
			$("#beModel").empty();																	// Clear select
			$("#beModel").append("<option>Choose student</option>");								// Add choose
			for (i=0;i<app.students.length;++i)	v.push(app.students[i].id);							// Get all students
			v.sort();																				// Sort 
			for (i=0;i<v.length;++i) 	$("#beModel").append("<option>"+v[i]+"</option>");			// Add option
			$("#beModel").val(app.students[app.curStudent].id);										// Current student
		}

		function addBones() {																		// FILL BONES PULLDOWN
			var v=[];
			$("#beBone").empty();																	// Clear select
			$("#beBone").append("<option>Choose bone</option>");									// Add choose
			var base=_this.models[$("#beModel").val()].bones;										// Point at bones array
			for (var bone in base) 			v.push(bone);											// Add bone to array
			v.sort();																				// Sort bones
			for (var i=0;i<v.length;++i) 	$("#beBone").append("<option>"+v[i]+"</option>");		// Add option
			}

		function addPoses() {																		// FILL POSES PULLDOWN
			var v=[];
			$("#bePose").empty();																	// Clear select
			$("#bePose").append("<option>Choose pose</option>");									// Add choose
			var base=app.poses;																		// Point at poses array
			for (var p in app.poses) 			v.push(p);											// Add pose to array
			v.sort();																				// Sort bones
			for (var i=0;i<v.length;++i) 	$("#bePose").append("<option>"+v[i]+"</option>");		// Add option
			}

		function addSeqs() {																		// FILL SEQS PULLDOWN
			var v=[];
			$("#beSeqs").empty();																	// Clear select
			$("#beSeqs").append("<option>Choose sequence</option>");								// Add choose
			for (var p in app.seqs) 			v.push(p);											// Add sequence to array
			v.sort();																				// Sort bones
			for (var i=0;i<v.length;++i) 	$("#beSeqs").append("<option>"+v[i]+"</option>");		// Add option
			$("#beSeqs").append("<option>talk</option>");											// Add talk
			}

		function moveBone() {																		// Move the bone
			var x=$("#beXaxis").val(),y=$("#beYaxis").val(),z=$("#beZaxis").val();					// Get vals
			if ($("#beBone").val() == "base")	x=x*3,z=z*3;										// Scale up base x & z
			_this.SetBone($("#beModel").val(),$("#beBone").val(),x,y,z);							// Set bone
			}
	}
	
// ANIMATION ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	Render() 																			// RENDER LOOP
	{
		var now=new Date().getTime();																// Get current time in ms
		if (now-app.sc.lastTime > 100)	{															// Don't go too fast
			app.sc.controls.update();																// Update control time
			app.sc.AnimateScene();																	// Animate models
			if (app.sc.outliner) 	app.sc.outliner.render(app.sc.scene, app.sc.camera );			// Render outline
			else					app.sc.renderer.render(app.sc.scene,app.sc.camera);				// Render scene
			app.sc.lastTime=now;																	// Then is now
			app.sc.SetClock(app.curClock+=.75);		
			}
		requestAnimationFrame(app.sc.Render);														// Recurse
	}

	AnimateScene()																				// CALLED EVERY FRAME BY ANIMATE FUNCTION
	{
		var i,j,pct,a;
		var seq,bones,model,br,b;
		var x,y,z;
		var now=new Date().getTime();																// Get current time in ms
		for (i=0;i<app.animateData.length;++i)	{													// For each action
			seq=app.animateData[i];																	// Point at action
			if (now < seq.start) continue;															// Ignore if before action
			if (now > seq.start+seq.dur) {															// If past action
				app.animateData.splice(i,1);														// Remove it
				continue;																			// Ignore 
				}
			pct=(now-seq.start)/seq.dur;															// Get % in sequence
			pct=1.0-((Math.cos(3.1414*pct)+1)/2.0);													// Full cosine curve
			for (j=0;j<seq.bones.length;++j) {														// For each bone
				b=seq.bones[j];																		// Point at bone 						
				br=app.sc.models[seq.model].bones[b.bone].rotation;									// Point at rotation						
				if (b.bone == "base") {																// Base bone's X & Z axes set by object directly, not bone
					br.x=app.sc.models[seq.model].bones[b.bone].oxr;								// Don't move XR
					br.z=app.sc.models[seq.model].bones[b.bone].ozr;								// ZR
					br.y=b.sy+(b.ey-b.sy)*pct;														// Y
					model=this.models[seq.model].model;												// Point at model			
					model.position.x=b.sx+(b.ex-b.sx)*pct+model.oxp;								// Set base X position via model, not bone
					model.position.z=b.sz+(b.ez-b.sz)*pct+model.ozp;								// Z
					}	
				else{																				// Normal bone
					br.x=b.sx+(b.ex-b.sx)*pct;														// Interpolate x angle and set bone to it
					br.y=b.sy+(b.ey-b.sy)*pct;														// Y
					br.z=b.sz+(b.ez-b.sz)*pct;														// Z
					}
				}															
			a=(this.models[seq.model].bones["thighL"].rotation.x-this.models[seq.model].bones["thighL"].oxr)*180/Math.PI;	// Angle of left thigh in degress
			this.models[seq.model].bones["base"].position.z=a/40;									// Left thigh controls height for sitting									
			}
		
		var jaw=[0,0,0,1,2,3,4,3,2,4,4,3,2,1,1,1,1,2,3,4,3,3,2,2,1,1,0,0,0,0]
		if ((app.voice.talking == 1) && (app.curStudent >= 0))	{									// If student talking
			app.sc.SetBone(app.students[app.curStudent].id,"mouth",jaw[app.sc.aniTimer%(jaw.length-1)]*2,0,0);	// Animate mouth
//			app.sc.SetBone(app.students[app.curStudent].id,"spine",0,0,Math.cos((app.sc.aniTimer+20)/15*Math.PI)*.4+.8*.00001);	// Spine
			}
		for (i=0;i<app.students.length;++i)															// For each student
			if (app.students[i].fidget)	{															// If fidgeting
				app.sc.SetBone(app.students[i].id,"thighR",-78,Math.cos(app.sc.aniTimer/15*Math.PI)*1+1*.0001,0);		// LegR
				app.sc.SetBone(app.students[i].id,"thighL",-78,-Math.cos((app.sc.aniTimer+10)/15*Math.PI)*1+1*.0001,0);	// LegL
				app.sc.SetBone(app.students[i].id,"spine",0,0,Math.cos((app.sc.aniTimer+20)/15*Math.PI)*.8+.8*.00001);	// Spine
				}	
		++app.sc.aniTimer;																			// Advance timer
	}

	StartAnimation(model, seqs)																	// QUEUE UP ACTION SEQUENCE
	{
		var i,j,k,b,o,v;
		var cbs=[],rad,bs;
		if (!seqs)	return;																			// Quit of no seqs
		seqs=seqs.split(",");																		// Get parts
		var repeat=seqs[seqs.length-1];																// Last element is repeat
		if (!seqs.length%2)	repeat=1;																// If omitted, do it one time
		var modObj=this.models[model].model;														// Point at model object
		var bones=this.models[model].bones;															// Point at bones array of model
		for (b in bones)	cbs[b]={ x:bones[b].rotation.x, y:bones[b].rotation.y, z:bones[b].rotation.z }; // Save rotation for each bone			
		cbs["base"].x=modObj.position.x-modObj.oxp;													// Get X position from model for base bone
		cbs["base"].z=modObj.position.z-modObj.ozp;													// Z
		var start=new Date().getTime();																// Start time for sequence member

		for (i=0;i<repeat;++i) {																	// For each time to do it
			for (j=0;j<seqs.length-1;j+=2) {														// For each sequence member bone/time pair
				if (!app.poses[seqs[j]])	continue;												// Bad pose
				v=app.poses[seqs[j]].split(",");													// Point at bones parts
				bs=[];																				// Clear bone array
				for (k=0;k<v.length;k+=4) {															// Stride by 4
					o={ bone:v[k] };																// Add bone name
					rad=(v[k] == "base") ? 1 : Math.PI/180;											// Convert to radians on all bones except base
					b=bones[v[k]];																	// Point at bone
					o.sx=cbs[v[k]].x;	 o.sy=cbs[v[k]].y;  		o.sz=cbs[v[k]].z;				// Start from current pos
					cbs[v[k]].x=o.ex=v[k+1]*rad+b.oxr;												// Normalized end X pose, and set new cbs
					cbs[v[k]].y=o.ey=v[k+2]*rad+b.oyr;  											// Y
					cbs[v[k]].z=o.ez=v[k+3]*rad+b.ozr;												// Z
					bs.push(o);
					}
				app.animateData.push({ model:model, start:start, dur:seqs[j+1]*1000, bones:bs });	// Save animation data
				start+=seqs[j+1]*1000;																// Start next member at end of last
				}
			}
	}

	GetScreenPos(obj)																			// GET SCREEN POS OF 3D OBJECT
	{	
		var w=window.innerWidth/2, h=window.innerHeight/2;
		var pos=new THREE.Vector3();
		pos=pos.setFromMatrixPosition(obj.matrixWorld);		
		pos.project(this.camera);																	// Project pos
		pos.x=(pos.x*w)+w;																			// In screen coords X
		pos.y=-(pos.y*h)+h;																			// Y
		return pos;																					// Return pos
	}

	GetModelPos(x,y)																			// GET SCREEN POS OF 3D OBJECT
	{	
		this.mouse.x=(x/ this.renderer.domElement.clientWidth)*2-1;									// Get x 0-1
		this.mouse.y=-(y/this.renderer.domElement.clientHeight)*2+1;								// Y
		this.raycaster.setFromCamera(this.mouse,this.camera);										// Cast ray
		let intersects=this.raycaster.intersectObjects(app.sc.scene.children,true);					// Get intersect		
		return intersects[0] ? intersects[0] : "";													// Return id
	}

	GetObjectFromId(id)																			// GET OBJECT FROM UUID	
	{
		let i;
		for (i=0;i<app.sc.scene.children.length;++i)												// For each object
			if (app.sc.scene.children[i].uuid == id)												// A match
				return(app.sc.scene.children[i]);													// Return object
		return null;																				// No match
	}		

}  // SCENE CLOSURE