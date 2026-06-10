using System;
using System.IO;
using System.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocumentFormat.OpenXml;

class Program {
  static string Txt(OpenXmlElement e)=>string.Concat(e.Descendants<Text>().Select(t=>t.Text));
  static void Main(){
    var src = @"C:\Users\fptshop\hbc-store-ui\DATN_style_target.docx";
    var dst = @"C:\Users\fptshop\Downloads\DATN_(1)_stylefix.docx";
    File.Copy(src,dst,true);
    using var doc = WordprocessingDocument.Open(dst,true);
    var body = doc.MainDocumentPart!.Document.Body!;
    string heading = "";
    foreach(var el in body.ChildElements){
      if(el is Paragraph p){
        var t = Txt(p).Trim();
        if(t.StartsWith("3.3.3.")) heading = t;
      }
      else if(el is Table tbl && heading.StartsWith("3.3.3.")){
        foreach(var para in tbl.Descendants<Paragraph>()){
          var pPr = para.ParagraphProperties;
          if(pPr == null){ pPr = new ParagraphProperties(); para.PrependChild(pPr); }
          var style = pPr.ParagraphStyleId;
          if(style == null){ style = new ParagraphStyleId(); pPr.PrependChild(style); }
          style.Val = "Content";
        }
      }
    }
    doc.MainDocumentPart!.Document.Save();
    Console.WriteLine(dst);
  }
}
