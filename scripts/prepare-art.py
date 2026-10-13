"""Adapt supplied and generated artwork using the package's authorized crop/atlas workflow."""
from PIL import Image,ImageOps,ImageDraw,ImageFont
from pathlib import Path
import json,csv
from fontTools import subset
root=Path('public/art');root.mkdir(parents=True,exist_ok=True)
def save(im,id,size):
 im=ImageOps.fit(im.convert('RGB'),size,method=Image.Resampling.NEAREST)
 im.save(root/(id+'.webp'),quality=88,method=6)
concept=Path('source-spec/art-direction/assets/concepts')
council=Image.open(concept/'01_war_council_key_art.png')
save(council,'BG_TITLE',(640,480));save(council,'BG_COUNCIL',(432,164))
battle=Image.open(concept/'03_sekigahara_battlefield_concept.png')
ending=Image.open('art-source/endings.png');w,h=ending.size
for i,id in enumerate(['ENDING_GOOD','ENDING_NORMAL','ENDING_BAD']):save(ending.crop((i*w//3,0,(i+1)*w//3,h)),id,(640,480))
portraits=Image.open('art-source/portraits.png');w,h=portraits.size
ids=['IEYASU','HONDA','II','FUKUSHIMA','KURODA','ISHIDA','OTANI','KOBAYAKAWA']
for i,id in enumerate(ids):save(portraits.crop(((i%4)*w//4,(i//4)*h//2,(i%4+1)*w//4,(i//4+1)*h//2)),'PORTRAIT_'+id,(96,96))
for id in ['EVENT_CH1_REGENTS','EVENT_CH2_AIZU','EVENT_CH3_FUSHIMI','EVENT_CH4_MINO','EVENT_CRISIS_FAMINE','EVENT_CRISIS_REBELLION','EVENT_CRISIS_FLOOD','EVENT_CRISIS_PLAGUE','EVENT_CRISIS_RAID']:
 im=ImageOps.fit(council if id=='EVENT_CH1_REGENTS' else battle,(320,180),method=Image.Resampling.NEAREST).convert('RGB');d=ImageDraw.Draw(im);d.rectangle((0,164,320,180),fill='#151311');d.text((4,167),'PROVISIONAL PLATE / '+id.replace('EVENT_',''),fill='#e4d2a8');im.save(root/(id+'.webp'),quality=85)
fontdir=root/'fonts';fontdir.mkdir(exist_ok=True)
for name,path in [('display','/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'),('body','/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf')]:
 options=subset.Options();options.flavor='woff2';font=subset.load_font(path,options);sub=subset.Subsetter(options=options);sub.populate(unicodes=list(range(32,256))+list(range(0x2000,0x2070))+[0x2192,0x2194,0x25c6,0x25b2,0x2660,0x2691,0x2212,0x2264,0x2265]);sub.subset(font);subset.save_font(font,str(fontdir/(name+'.woff2')),options)
for size in [192,512]:
 im=Image.new('RGB',(size,size),'#151311');d=ImageDraw.Draw(im);m=size//6;d.rectangle((m,m,size-m,size-m),outline='#c49a4a',width=max(2,size//40));f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',size//4);d.text((size*.24,size*.34),'MC',font=f,fill='#e4d2a8');im.save('public/icon-'+str(size)+'.png')
records=list(csv.DictReader(open('src/assets/asset-manifest.csv')))
with open('ASSET_COVERAGE.md','w') as out:
 out.write('# Asset coverage\n\nGenerated portraits are conjectural illustrations. Generated crests are decorative and are not treated as verified heraldry. Source concepts are retained. All files are local.\n\n| ID | Status | Implementation |\n|---|---|---|\n')
 for r in records:
  id=r['asset_id'];exists=(root/(id+'.webp')).exists();status='final' if exists and not id.startswith('EVENT_') else 'placeholder'
  if id.startswith('FONT_'):status='final'
  impl='Local WebP' if exists else 'Bundled WOFF2' if id.startswith('FONT_') else 'Semantic UI / canvas glyphs under stable ID'
  out.write(f'| {id} | {status} | {impl} |\n')
