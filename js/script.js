moment.locale('ru');
new Vue({
    el: '#app',
    name: 'Markdown Notebook',
    data() {
        return {
            notes: JSON.parse(window.localStorage.getItem('notes')) || [],
            selectedNote: null,
        }
    },
    computed: {
        htmlOutput() {
            return marked(this.content)
        },
        content: {
            get() {
                return this.selectedNote.content;
            },
            set(val) {
                this.selectedNote.content = val;
            }
        },
        sortedNotes() {
            // Простой алгоритм работает с багом! =((
            // return this.notes.slice()
            //     .sort((a, b) => a.created - b.created)
            //     .sort((a, b) => a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1);
            let copy = this.notes.slice();
            const favFiltered = copy.filter((item, index) => {
                return item.favorite;
            });
            let unfavFiltered = copy.filter((item, index) => {
                return !item.favorite;
            });

            unfavFiltered = unfavFiltered.sort((a, b) => a.created - b.created);
            return favFiltered.concat(unfavFiltered);

        },
        wordCount() {
            let content = this.selectedNote.content;
            content = content.replace(/\r\n | \n | \r/g, " ");
            content = content.replace(/(^\s+)|(\s+$)/gi, "");
            content = content.split(/\s+/);
            if (content.length === 1 && content[0] === "") {
                return 0;
            } else {
                return content.length;
            }

        },
        lineCount() {
            const match = this.selectedNote.content.match(/.*\n/gi);
            if (match) {
                return match.length;
            } else {
                return 0;
            }

        },
        charCount() {
            return this.selectedNote.content.split('').length;
        }
    },

    filters: {
        date(val) {
            return moment(val).format('LLLL');
        }
    },
    watch: {
        notes: {
            handler(val) {
                window.localStorage.setItem('notes', JSON.stringify(val));
            },
            deep: true
        },
        selectedNote(val) {
            if (val) {
                window.localStorage.setItem('selected-id', val.id);
            }
        }
    },
    methods: {
        addNote() {
            const date = Date.now();
            this.selectedNote = {
                id: String(date),
                content: '',
                title: `Запись № ${this.notes.length + 1}`,
                created: date,
                favorite: false
            };
            this.notes.push(this.selectedNote);
        },
        findNote(id) {
            for (let note of this.notes) {
                if (note.id === id) {
                    return note;
                }
            }
            return null;
        },
        selectNote(id) {
            const noteObj = this.findNote(id);
            if (noteObj) {
                this.selectedNote = noteObj;

                this.$nextTick(function() {
                    const text = document.getElementById('textinput');
                    M.textareaAutoResize(text);
                })
            }
        },
        deleteNote(id) {
            const noteObj = this.findNote(id);
            let noteObjIndex = null;
            if (noteObj && confirm('Удалить запись?')) {
                noteObjIndex = this.sortedNotes.indexOf(noteObj);
                this.notes = this.notes.filter(item => item.id !== id);
                // После удаления выделяем другой элемент или нетрогаем если удалялся не выделенный
                if (this.selectedNote === noteObj) {
                    if (this.sortedNotes[noteObjIndex]) {
                        this.selectNote(this.notes[noteObjIndex].id);
                    } else if (this.sortedNotes[noteObjIndex - 1]) {
                        this.selectNote(this.notes[noteObjIndex - 1].id);
                    } else {
                        this.selectedNote = null;
                    }
                }
            }
        },
        toggleFavorite(id) {
            const noteObj = this.findNote(id);
            noteObj.favorite = !noteObj.favorite;
        },
        changeTitle(id, e) {
            const noteObj = this.findNote(id);
            const titleText = noteObj.title;
            const titleEditor = document.createElement('input');
            titleEditor.type = 'text';
            titleEditor.classList.add('truncate', 'browser-default', 'note-item__title-editor');
            titleEditor.value = titleText;
            // Временно скрываем текст заголовка чтобы избежать наслоения
            e.srcElement.style.display = 'none';
            // Замещаем отображения заголовка "редактром"
            e.srcElement.parentNode.prepend(titleEditor);
            // Выделяем текст в редакторе
            titleEditor.select();

            function saveTitle() {
                noteObj.title = titleEditor.value;
                titleEditor.remove();
                e.srcElement.style.display = '';
            }

            titleEditor.addEventListener('blur', saveTitle);
            titleEditor.addEventListener('keypress', (e) => {
                if (e.keyCode === 13) {
                    e.target.blur();
                }
            });
        }
    },
    created() {
        const selectedId = window.localStorage.getItem('selected-id');
        if (selectedId) {
            this.selectNote(selectedId)
        }

    }
});