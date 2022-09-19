console.clear();

const regl = createREGL();

const drawColors = regl({
	vert: `
		precision highp float;

		attribute vec2 position;
		varying vec2 v_position;

		void main() {
			gl_Position = vec4(position, 0, 1);
			v_position = (position + 1.0) * 0.5;
		}
	`,
	frag: `
		// Using mediump precision causes some nasty banding on mobile after a while.
		// My best guess is this is due to u_time becoming too large.
		precision highp float;

		uniform float u_time;
		uniform vec3 u_rotXOffset;
		uniform vec3 u_rotYOffset;
		uniform float u_g1FreqMult;
		varying vec2 v_position;

		const float TAU = 6.2831853072;
		
		void main() {
			// Apply rotation offsets.
			vec3 xRot = u_rotXOffset * v_position.x;
			vec3 yRot = u_rotYOffset * v_position.y;

			// For each color channel, a unique set of equations are created that define how
			// much influence the channel has on the overall color of the pixel. These equations
			// are all wave functions based on trig and use the pixel's current position and the time
			// as input to control each wave. These equations are combined later on.
			// Warning: Lots of magic numbers used to control the wave functions.

			vec3 r = vec3(
				cos((xRot[0] + yRot[0] * u_rotXOffset[2] * 2.0 + u_time / 8000.0) * TAU),
				cos((xRot[2] + yRot[2] * u_rotXOffset[2] + u_time / 8000.0) * TAU),
				sin((v_position.x * 0.4 - u_time / 16000.0) * TAU)
			);

			vec3 g = vec3(
				-cos(((xRot[0] + yRot[0]) * (u_g1FreqMult + 2.0) + u_time / 4000.0) * TAU),
				-cos((xRot[1] + yRot[1] * 0.8 - u_time / 4400.0) * TAU),
				sin((v_position.x * 0.5 + u_time / 20000.0) * TAU)
			);

			vec3 b = vec3(
				-cos((v_position.x * u_rotXOffset[0] * 1.65 - u_time / 2000.0) * TAU),
				-cos((v_position.x * 0.8 + u_time / 4000.0) * TAU),
				sin((v_position.y * 0.4 + u_time / 24000.0 + 0.75) * TAU)
			);

			// r/g/b values above will range from -1 to +1. Shift them so they range from 0 to +1.
			r = (r + 1.0) / 2.0;
			g = (g + 1.0) / 2.0;
			b = (b + 1.0) / 2.0;

			gl_FragColor = vec4(
				(r[0] * 0.6 + r[1]) / 1.6 * (r[2] * 0.5 + 0.5),
				(g[0] * 0.6 + g[1]) / 1.6 * (g[2] * 0.5 + 0.5),
				(b[0] * 0.6 + b[1]) / 1.6 * (b[2] * 0.5 + 0.5),
				1
			);
		}
	`,
	attributes: {
		// two triangles that cover screen
		position: regl.buffer([
			// tri 1
			[-1, 1],
			[1, 1],
			[-1, -1],
			// tri 2
			[1, -1],
			[-1, -1],
			[1, 1]
		])
	},
	uniforms: {
		u_time: regl.prop('u_time'),
		u_rotXOffset: regl.prop('u_rotXOffset'),
		u_rotYOffset: regl.prop('u_rotYOffset'),
		u_g1FreqMult: regl.prop('u_g1FreqMult')
	},
	count: 6
});

const timeOffset = Math.random() * 60000;

regl.frame(({ time }) => {
	const trueTime = time * 1000 + timeOffset;
	
	// We essentially rotate all of the following calculations to add a high level
	// of variation to the way colors move. Rotates slowly - once every 2 minutes.
	const angle1 = trueTime / 120000 * Math.PI * 2;
	const angle2 = angle1 + 0.5;
	const angle3 = angle1 + Math.PI / 2;
	const rotXOffset1 = Math.sin(angle1);
	const rotXOffset2 = Math.sin(angle2);
	const rotXOffset3 = Math.sin(angle3);
	const rotYOffset1 = Math.cos(angle1);
	const rotYOffset2 = Math.cos(angle2);
	const rotYOffset3 = Math.cos(angle3);
	// Unique oscillating value to control g1 frequency.
	// Oscillates faster than rotation above.
	const g1FreqMult = Math.sin(trueTime / 24000 * Math.PI * 2);
	
	drawColors({
		u_time: trueTime,
		u_rotXOffset: [rotXOffset1, rotXOffset2, rotXOffset3],
		u_rotYOffset: [rotYOffset1, rotYOffset2, rotYOffset3],
		u_g1FreqMult: g1FreqMult
	});
});
