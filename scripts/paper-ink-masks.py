"""Derive transparent ink overlays; never rewrite any approved/source artwork.
Only warm paper-edge pixels near an alpha boundary are covered. Interior ink,
moon, lantern and textures are preserved. Keep a thin outer paper bevel.
Requires Pillow/numpy for this optional authoring step, never at game runtime.
"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
root=Path(__file__).resolve().parents[1]/'assets/scence/paper-diorama-v1'
for name,reach in [('sky',10),('forest',13),('village-v2',17),('foliage',21)]:
 src=Image.open(root/(name+'.png')).convert('RGBA');a=np.array(src);r,g,b,alpha=[a[:,:,i].astype(float) for i in range(4)]
 boundary=Image.fromarray(np.where(alpha<180,255,0).astype('uint8'))
 near=np.array(boundary.filter(ImageFilter.MaxFilter(reach*2+1)))>0
 # The printed outline already has irregular hand-cut contours. Follow them.
 warm=(r>135)&(g>110)&(b>65)&(r>=g)&(g>=b)&((r-g)<85)&((g-b)<85)&(alpha>170)
 outer=np.array(boundary.filter(ImageFilter.MaxFilter(3)))>0
 mask=warm&near&~outer
 out=np.zeros_like(a);out[:,:,:3]=[23,20,15];out[:,:,3]=np.where(mask,alpha,0).astype('uint8')
 Image.fromarray(out).save(root/(name+'-ink.png'),optimize=True)
 print(name,int(mask.sum()),'ink pixels')
