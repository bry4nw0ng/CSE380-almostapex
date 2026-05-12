precision mediump float;

uniform sampler2D u_Sampler;
uniform float u_FlashAmount;
uniform vec3 u_FlashColor;

varying vec2 v_TexCoord;

void main(){
	vec4 tex = texture2D(u_Sampler, v_TexCoord);
	vec3 mixed = mix(tex.rgb, u_FlashColor, u_FlashAmount);
	gl_FragColor = vec4(mixed, tex.a);
}
