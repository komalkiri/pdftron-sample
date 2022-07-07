import { Component, ViewChild, OnInit, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import WebViewer, { WebViewerInstance } from '@pdftron/webviewer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer') viewer: ElementRef;
  wvInstance: WebViewerInstance;
  @Output() coreControlsEvent:EventEmitter<string> = new EventEmitter(); 
  presetData = [
    {
      "tool_name": "AnnotationCreateRectangle",
      "preset": {
          "AnnotationCreateRectangle": {
              "StrokeColor": {
                  "R": 255,
                  "G": 0,
                  "B": 0,
                  "A": 1
              },
              "FillColor": {
                  "R": 0,
                  "G": 0,
                  "B": 0,
                  "A": 0
              },
              "StrokeThickness": 5.5,
              "StrokeOpacity":1,
              "Opacity": 0,
              "TextColor": {
                  "R": 0,
                  "G": 0,
                  "B": 0,
                  "A": 0
              }
          },
          "AnnotationCreateRectangle2": {
              "StrokeColor": {
                  "R": 136,
                  "G": 39,
                  "B": 31,
                  "A": 1
              },
              "FillColor": {
                  "R": 37,
                  "G": 210,
                  "B": 209,
                  "A": 0.6
              },
              "StrokeThickness": 3.0,
              "StrokeOpacity":1,
              "Opacity": 0.6,
              "TextColor": {
                  "R": 0,
                  "G": 0,
                  "B": 0,
                  "A": 0
              }
          },
          "AnnotationCreateRectangle3": {
              "StrokeColor": {
                  "R": 118,
                  "G": 40,
                  "B": 123,
                  "A": 0.7
              },
              "FillColor": {
                  "R": 226,
                  "G": 161,
                  "B": 230,
                  "A": 0.9
              },
              "StrokeThickness": 3.6,
              "StrokeOpacity":0.7,
              "Opacity": 0.9,
              "TextColor": {
                  "R": 0,
                  "G": 0,
                  "B": 0,
                  "A": 0
              }
          },
          "AnnotationCreateRectangle4": {
              "StrokeColor": {
                  "R": 255,
                  "G": 255,
                  "B": 0,
                  "A": 0.4
              },
              "FillColor": {
                  "R": 128,
                  "G": 229,
                  "B": 177,
                  "A": 0.5
              },
              "StrokeThickness": 3.8,
              "StrokeOpacity":0.4,
              "Opacity": 0.5,
              "TextColor": {
                  "R": 0,
                  "G": 0,
                  "B": 0,
                  "A": 0
              }
          }
      }
  }
  ];
  selectedRectanglePreset = "";
  isStroke: boolean = true;
  opacities = [];
  rectanglePresets = [];
  xfdfString="";
  private documentLoaded$: Subject<void>;

  constructor() {
    this.documentLoaded$ = new Subject<void>();
  }

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      initialDoc: '../files/PDFTRON_about.pdf'
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;
      let isStylePopupOpened = false;
      let redraw = false;
      this.coreControlsEvent.emit(instance.UI.LayoutMode.Single);

      const { documentViewer, Annotations, annotationManager, Tools } = instance.Core;

      documentViewer.addEventListener('documentLoaded', () => {
        this.documentLoaded$.next();
        
        for (let i = 0; i < this.presetData.length; i++) {
          Object.entries<any>(this.presetData[i]['preset']).forEach(([key, value]) => {
            documentViewer.getTool(key).setStyles({
              TextColor: new Annotations.Color(value?.TextColor?.R, value?.TextColor?.G,
                  value?.TextColor?.B, value?.TextColor?.A),
              StrokeColor: new Annotations.Color(value?.StrokeColor?.R, value?.StrokeColor?.G, 
                value?.StrokeColor?.B, value?.StrokeOpacity ?? 1),
              FillColor: new Annotations.Color(value?.FillColor?.R, value?.FillColor?.G, 
                value?.FillColor?.B, value?.Opacity),
              StrokeThickness: value?.StrokeThickness,
              Opacity: (key.includes('Rectangle')) ? 'unset' : value?.Opacity
            });
          });
        }
        for(const pre in this.presetData[0].preset) {
          this.opacities.push({
            stroke: this.presetData[0].preset[pre].StrokeOpacity || 1,
            fill: this.presetData[0].preset[pre].Opacity
          })
          this.rectanglePresets.push(pre)
        }
        console.log("opacities",this.opacities)
        console.log("rectangpresets",this.rectanglePresets)
        documentViewer.setToolMode(documentViewer.getTool("AnnotationCreateRectangle"));
        const iframe = document.getElementsByTagName("iframe")[0].contentDocument.body;
        const mList = iframe.getElementsByClassName('ToolsOverlay')[0];
        console.log("mlist",mList)
        const options = {
          childList: true,
          attributes: true,
          attributeFilter: ['class'],
          subtree: true
        };
        const observer = new MutationObserver((mutations:any)=>{
          if(this.selectedRectanglePreset){
            for (let mutation of mutations) {
              if (mutation.type === 'childList' && mutation.addedNodes.length && mutation.addedNodes[0].className === 'ToolStylePopup') 
              {
                console.log('style popup opened');
                isStylePopupOpened = true;
                if(this.isStroke) {
                  documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
                    Opacity: this.opacities[this.rectanglePresets.indexOf(this.selectedRectanglePreset)].stroke
                  }));
                } else {
                  documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
                    Opacity: this.opacities[this.rectanglePresets.indexOf(this.selectedRectanglePreset)].fill
                  }));
                }
              } else if (mutation.type === 'childList' && mutation.removedNodes.length && mutation.removedNodes[0].className === 'ToolStylePopup') 
              {
                console.log("style popup closed")
                isStylePopupOpened = false;
                documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
                  Opacity: 'unset'
                }));
              } else if (mutation.type === 'attributes' && 
                mutation.target.classList.contains('active') && 
                mutation.target.classList.contains('palette-options-button') ) 
              {
                if(mutation.target.innerText === 'Stroke') {
                  console.log("STROKE SELECTED")
                  this.isStroke = true;
                  documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
                    Opacity: this.opacities[this.rectanglePresets.indexOf(this.selectedRectanglePreset)].stroke
                  }));
                } else if(mutation.target.innerText === 'Fill') {
                  console.log("FILL SELECTED")
                  this.isStroke = false;
                  documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
                    Opacity: this.opacities[this.rectanglePresets.indexOf(this.selectedRectanglePreset)].fill
                  }));
                }
              }
            }
          }
        });
        observer.observe(mList, options);
      
      });
      
      documentViewer.addEventListener('toolModeUpdated', (e:any) => {
        if(e.name.includes('Rectangle')) {
          this.selectedRectanglePreset = e.name;
        } else{
          this.selectedRectanglePreset = "";
        }
        const iframe = document.getElementsByTagName("iframe")[0].contentDocument.body;
        const toolStylePopup = iframe.getElementsByClassName('ToolStylePopup');
        if(toolStylePopup.length && this.selectedRectanglePreset){
          const paletteOptions = toolStylePopup[0].getElementsByClassName('palette-options')[0];
          const activeButton = paletteOptions.getElementsByClassName('palette-options-button active')[0];
          this.isStroke = activeButton.innerHTML === 'Stroke';
          if(this.isStroke){
            documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
              Opacity: this.opacities[this.rectanglePresets.indexOf(this.selectedRectanglePreset)].stroke
            }));
          } else{
            documentViewer.getTool(this.selectedRectanglePreset).setStyles((currentStyle:any) => ({
              Opacity: this.opacities[this.rectanglePresets.indexOf(this.selectedRectanglePreset)].fill
            }));
          }
        }
      
      })
      documentViewer.addEventListener('toolUpdated', (e: any) => {
        if(e.defaults.Opacity !== 'unset'){
          if(this.selectedRectanglePreset){
            const index = this.rectanglePresets.indexOf(e.name);
            if(this.isStroke){
              const oldValue = this.opacities[index].stroke;
              const newValue = e.defaults.Opacity;
              if(oldValue !== newValue){
                console.log("stroke opacity changed")
                this.opacities[index].stroke = newValue;
              }
            } else{
              const oldValue = this.opacities[index].fill;
              const newValue = e.defaults.Opacity;
              if(oldValue !== newValue){
                console.log("Fill opacity changed")
                this.opacities[index].fill = newValue;
              }
            }
          }
        }
    
      });
      annotationManager.addEventListener(
        'annotationChanged',
        (annotations: any, action: any, { imported }: any) => {
          if (imported) return;
            if(annotations[0].Subject === 'Rectangle' && !annotations[0].isAppearance){
              annotations[0].setCustomData('isAppearance', true);
              const canvas = document.createElement('canvas');
              canvas.width = annotations[0].Width;
              canvas.height = annotations[0].Height;
              const context = canvas.getContext('2d');
              const x = -annotations[0].X;
              const y = -annotations[0].Y;
              context?.translate(x, y);
              const doc = documentViewer.getDocument();
              const page = doc.getPageMatrix(annotations[0].PageNumber);
              annotations[0].draw(context, page);

              (async () => {
                const pdfDocument = await instance.Core.createDocument(canvas.toDataURL(), {
                  useDownloader: false,
                  filename: "custom-appearance.png"
                });
                await annotations[0].addCustomAppearance(pdfDocument, { pageNumber: 1 });
                annotationManager.redrawAnnotation(annotations[0])
              })();
              console.log("aftercustomappearance")
            }
            
            annotationManager.exportAnnotations().then(async (xfdfString: any) => {
              this.xfdfString = xfdfString;
              console.log(this.xfdfString)
            });
          
        }
      );
      documentViewer.addEventListener('annotationsLoaded', () => {
        annotationManager.importAnnotations(this.xfdfString);
      });
    })
  }

  ngOnInit() {
    this.xfdfString = `<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"><pdf-info xmlns="http://www.pdftron.com/pdfinfo" version="2" import-version="4" /><fields /><annots><link page="1" rect="105.239,485.03,190.834,498.242" color="#000000" name="5dd9e623f24904ff-91e21abc482c8c7c" width="0" style="solid"><apref gennum="0" objnum="225" x="105.239" y="498.242"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/news/pdftron-ranked-top-pdf-sdk/"/></Action></OnActivation></link><link page="1" rect="366.191,613.03,459.706,626.242" color="#000000" name="5dd9e625f2490501-91e21aba482c8c7a" width="0" style="solid"><apref gennum="0" objnum="227" x="366.191" y="626.242"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/pdf-js/guide-to-evaluating-pdf-js/#why-organizations-switch-from-pdfjs"/></Action></OnActivation></link><link page="1" rect="459.898,581.03,573.465,594.242" color="#000000" name="5dd9e627f2490503-91e21ab8482c8c78" width="0" style="solid"><apref gennum="0" objnum="229" x="459.898" y="594.242"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/pdf-js/guide-to-evaluating-pdf-js/"/></Action></OnActivation></link><link page="1" rect="318.6,565.03,364.943,578.242" color="#000000" name="5dd9e629f2490505-91e21ab6482c8c76" width="0" style="solid"><apref gennum="0" objnum="231" x="318.6" y="578.242"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/pdf-js/guide-to-evaluating-pdf-js/"/></Action></OnActivation></link><link page="2" rect="83.6038,72.0121,308.709,85.3141" color="#000000" name="5dd9e62bf2490507-91e21ab4482c8c74" width="0" style="solid"><apref gennum="0" objnum="233" x="83.6038" y="85.31410000000005"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/customers/how-kalsefer-streamlined-drm-security/"/></Action></OnActivation></link><link page="3" rect="80.6633,565.03,108.071,578.242" color="#000000" name="5dd9e62df2490509-91e21ab2482c8c72" width="0" style="solid"><apref gennum="0" objnum="235" x="80.6633" y="578.242"/><OnActivation><Action Trigger="U"><URI Name="https://slack.engineering/what-matters-to-you-matters-to-us-10ff49650a5d"/></Action></OnActivation></link><link page="3" rect="112.931,565.03,159.166,578.242" color="#000000" name="5dd9e62ff249050b-91e21ab0482c8c70" width="0" style="solid"><apref gennum="0" objnum="237" x="112.931" y="578.242"/><OnActivation><Action Trigger="U"><URI Name="https://blogs.dropbox.com/tech/2017/12/improving-document-preview-performance/"/></Action></OnActivation></link><link page="3" rect="185.806,565.03,230.385,578.242" color="#000000" name="5dd9e631f249050d-91e21aae482c8c6e" width="0" style="solid"><apref gennum="0" objnum="239" x="185.806" y="578.242"/><OnActivation><Action Trigger="U"><URI Name="https://engineering.linkedin.com/blog/2019/04/under-the-hood--learning-with-documents"/></Action></OnActivation></link><link page="5" rect="57.7797,573.27,123.395,586.482" color="#000000" name="5dd9e633f249050f-91e21aac482c8c6c" width="0" style="solid"><apref gennum="0" objnum="241" x="57.7797" y="586.482"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/pdf-format/what-is-pdf-linearization/"/></Action></OnActivation></link><link page="6" rect="36,605.27,211.474,618.482" color="#000000" name="5dd9e635f2490511-91e21aaa482c8c6a" width="0" style="solid"><apref gennum="0" objnum="243" x="36" y="618.482"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/customers/ccs-delivers-fast-reliable-rendering/"/></Action></OnActivation></link><link page="7" rect="230.733,634.07,264.464,647.282" color="#000000" name="5dd9e637f2490513-91e21aa8482c8c68" width="0" style="solid"><apref gennum="0" objnum="245" x="230.733" y="647.282"/><OnActivation><Action Trigger="U"><URI Name="https://www.plangrid.com/ebook/construction-disconnected/"/></Action></OnActivation></link><link page="7" rect="158.506,506.07,276.693,519.282" color="#000000" name="5dd9e639f2490515-91e21aa6482c8c66" width="0" style="solid"><apref gennum="0" objnum="247" x="158.506" y="519.282"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/customers/how-oec-graphics-upgraded-its-fusion-ux/"/></Action></OnActivation></link><link page="7" rect="36,490.07,63.3356,503.282" color="#000000" name="5dd9e63bf2490517-91e21aa4482c8c64" width="0" style="solid"><apref gennum="0" objnum="249" x="36" y="503.282"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/blog/customers/how-oec-graphics-upgraded-its-fusion-ux/"/></Action></OnActivation></link><link page="8" rect="461.733,565.03,515.517,578.242" color="#000000" name="5dd9e63df2490519-91e21aa2482c8c62" width="0" style="solid"><apref gennum="0" objnum="251" x="461.733" y="578.242"/><OnActivation><Action Trigger="U"><URI Name="https://www.pdftron.com/company/contact-us/"/></Action></OnActivation></link><underline page="0" rect="36,357.630,65.850,396.420" color="#000000" flags="print" name="1ee276e4-9c0e-40a5-cf6c-26ec92a82321" title="Guest" subject="Underline" date="D:20220707191646+05'30'" creationdate="D:20220707191646+05'30'" coords="36,396.42,65.85,396.42,36,357.63,65.85,357.63"><trn-custom-data bytes="{&quot;trn-annot-preview&quot;:&quot;6 I&quot;}"/></underline></annots><pages><defmtx matrix="1,0,0,-1,0,792" /></pages></xfdf>`;
  }

  getDocumentLoadedObservable() {
    return this.documentLoaded$.asObservable();
  }
}
