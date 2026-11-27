# Builds the 1200x630 social previews in public/og/ from the artist photos in src/artists/.
# Run after changing an artist photo:
#   uv run --no-project --with pillow --with fonttools --with brotli python scripts/make-og.py .
import sys,io
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image,ImageDraw,ImageFont
R=sys.argv[1]
def font(path,wght,size):
    f=TTFont(path); 
    if 'fvar' in f: f=instancer.instantiateVariableFont(f,{'wght':wght})
    b=io.BytesIO(); f.flavor=None; f.save(b); b.seek(0); return ImageFont.truetype(b,size)
mono=lambda s:ImageFont.truetype(io.BytesIO(_m),s)
_m=io.BytesIO(); t=TTFont(R+'/public/fonts/dm-mono-500.woff2'); t.flavor=None; t.save(_m); _m=_m.getvalue()
logo=Image.open(R+'/the-butchers-logo-transparent.png').convert('RGBA'); logo=logo.crop(logo.getbbox())
for slug,name in [('lucky-voda','Lucky Voda'),('piace','Piace'),('veeto','VEETO'),('loza','LOZA'),('mantra','mantra')]:
    W,H=1200,630; im=Image.new('RGB',(W,H),(0,0,0))
    ph=Image.open(f'{R}/src/artists/{slug}.webp').convert('RGB').resize((H,H),Image.LANCZOS)
    # fade the photo's right edge into black
    F=200; m2=Image.new('L',(H,H),255); m2.putdata([255 if x<H-F else round(255*(H-x)/F) for y in range(H) for x in range(H)])
    im.paste(ph,(0,0),m2)
    d=ImageDraw.Draw(im); x=H+20; 
    d.text((x,150),'THE BUTCHERS RECORDS',font=mono(22),fill=(184,175,164),spacing=4)
    size=130
    while True:
        f=font(R+'/public/fonts/playfair-variable.woff2',800,size)
        if d.textlength(name,font=f)<=W-x-48 or size<60: break
        size-=4
    d.text((x,205),name,font=f,fill=(240,233,220))
    d.rectangle((x,205+size+40,x+64,205+size+43),fill=(169,39,37))
    d.text((x,205+size+70),'thebutchersrecords.it/artisti',font=mono(20),fill=(147,140,130))
    lg=logo.resize((150,round(150*logo.height/logo.width)),Image.LANCZOS); im.paste(lg,(W-150-40,H-lg.height-36),lg)
    im.save(f'{R}/public/og/{slug}.jpg',quality=85,optimize=True,progressive=True); print(slug,size)
