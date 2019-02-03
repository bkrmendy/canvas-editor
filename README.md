This is a very basic text editor built on the HTML Canvas API written in Typescript with a React wrapper.

Features:
- Basic text editing
- Basic styles: Title, Subtitle, Plain text, Bold, Italic (though other styles can be easily added)
- Undo / Redo
- Copy / Paste

Lessons learned from this are the following:
- Typescript: scales very well to a bigger projects like this, was an absolute pleasure to use. Although some features of JS are lost (like duck typing), advanced type checking more than makes up for it.
- Browser APIs: Although cross browser compatibility was not an explicit goal (99% of testing took place in Safari), it was still shocking to see how many bugs appeared in other browsers (Chrome). Extra care has to be taken when picking input events to achieve minimum headache during development.
- More control -> more responsibility: while it was fun to code line breaking logic or just a simple blinking cursor, I think few projects (if any) justify such a low-level approach only for text editing (but for example an in-browser equivalent of Photoshop or PowerPoint might have to implement stuff like this for advanced text effects). Also, accessibility becomes a problem (canvas cannot be read by screen readers, so a backing HTML representation of the document has to be rendered,ehich is easy with React and after which managing selection state becomes a lot less painful than writing a text editor from scratch).

