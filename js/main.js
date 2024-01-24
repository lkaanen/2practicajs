const storageKey = 'notes-app';
const storageData = localStorage.getItem(storageKey);

// Инициализация данных приложения из localStorage или создание новых данных
const initialData = storageData ? JSON.parse(storageData) : {
    firstColumn: [],
    secondColumn: [],
    thirdColumn: []
};

// Создание экземпляра Vue
const app = new Vue({
    el: '#app', // Привязка Vue к элементу с id "app"
    data() {
        return {
            // Инициализация данных приложения
            firstColumn: initialData.firstColumn,
            secondColumn: initialData.secondColumn,
            thirdColumn: initialData.thirdColumn,
            groupName: null,
            inputOne: null,
            inputTwo: null,
            inputThr: null,
            inputFor: null,
            noteTitle: '',
            items: []
        };
    },
    watch: {
        // Наблюдение за изменениями в firstColumn
        firstColumn: {
            handler: function(newFirstColumn) {
                this.saveData(); // Сохранение данных при изменении firstColumn
            },
            deep: true // Глубокое наблюдение за изменениями внутри объектов firstColumn
        },
        // Наблюдение за изменениями в secondColumn
        secondColumn: {
            handler: function(newSecondColumn) {
                this.saveData(); // Сохранение данных при изменении secondColumn
                this.checkDisableFirstColumn(); // Проверка и блокировка элементов первого столбца
            },
            deep: true // Глубокое наблюдение за изменениями внутри объектов secondColumn
        },
        // Наблюдение за изменениями в thirdColumn
        thirdColumn: {
            handler: function(newThirdColumn) {
                this.saveData(); // Сохранение данных при изменении thirdColumn
            },
            deep: true // Глубокое наблюдение за изменениями внутри объектов thirdColumn
        },
        // Наблюдение за изменениями в items
        items: {
            handler: function(newItems) {
                this.saveData(); // Сохранение данных при изменении items
                this.checkDisableFirstColumn(); // Проверка и блокировка элементов первого столбца
            },
            deep: true // Глубокое наблюдение за изменениями внутри объектов items
        }
    },
    methods: {
        // Метод для сохранения данных в localStorage
        saveData() {
            const data = {
                firstColumn: this.firstColumn,
                secondColumn: this.secondColumn,
                thirdColumn: this.thirdColumn,
                items: this.items
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        },
        // Метод для удаления группы
        deleteGroup(groupId) {
            const index = this.thirdColumn.findIndex(group => group.id === groupId);
            if (index !== -1) {
                this.thirdColumn.splice(index, 1); // Удаление группы из thirdColumn
            }
        },
        // Метод для обновления прогресса
        updateProgress(card, item) {
            const checkedCount = card.items.filter(item => item.checked).length;
            const progress = (checkedCount / card.items.length) * 100;
            card.isComplete = progress === 100; // Обновление статуса завершенности карточки

            if (this.secondColumn.length === 5) {
                card.items.forEach(item => {
                    if (!item.checked) {
                        item.disabled = true; // Блокировка элементов карточки, если второй столбец полностью заполнен
                    }
                });
            }

            if (item.checked) {
                item.disabled = true; // Блокировка элемента, если его состояние изменено на "отмечено"
            } else {
                item.disabled = false;
                this.checkDisableFirstColumn(); // Проверка и блокировка элементов первого столбца
            }

            this.checkMoveCard(); // Проверка и перемещение карточек
        },
        // Метод для перемещения карточек из первого столбца во второй столбец
        MoveFirstColm() {
            this.firstColumn.forEach(card => {
                const progress = (card.items.filter(item => item.checked).length / card.items.length) * 100;

                const isMaxSecondColumn = this.secondColumn.length >= 5;

                if (progress >= 50 && !isMaxSecondColumn) {
                    this.secondColumn.push(card); // Перемещение карточки во второй столбец
                    this.firstColumn.splice(this.firstColumn.indexOf(card), 1); // Удаление карточки из первого столбца
                    this.MoveSecondColm(); // Проверка и перемещение карточек из второго столбца в третий столбец
                }
            });
        },
        // Метод для перемещения карточек из второго столбца в третий столбец
        MoveSecondColm() {
            this.secondColumn.forEach(card => {
                const progress = (card.items.filter(item => item.checked).length / card.items.length) * 100;
                if (progress === 100) {
                    card.isComplete = true; // Обновление статуса завершенности карточки
                    card.lastChecked = new Date().toLocaleString(); // Обновление времени последней отметки
                    this.thirdColumn.push(card); // Перемещение карточки в третий столбец
                    this.secondColumn.splice(this.secondColumn.indexOf(card), 1); // Удаление карточки из второго столбца
                    this.MoveFirstColm(); // Проверка и перемещение карточек из первого столбца во второй столбец
                }
            })
        },
        checkMoveCard() {
            this.MoveFirstColm();
            this.MoveSecondColm();
        },
        // Метод для проверки и блокировки элементов первого столбца
        checkDisableFirstColumn() {
            if (this.secondColumn.length === 5) {
                const areAllSecondColumnComplete = this.secondColumn.every(note => note.isComplete);
                this.firstColumn.forEach(note => {
                    note.items.forEach(item => {
                        const progress = (item.checkedCount / item.itemsCount) * 100;

                        if (progress >= 50 && !areAllSecondColumnComplete) {
                            item.disabled = true; // Блокировка всех элементов первого столбца, если хотя бы одна карточка в первом столбце заполнена на 50% или более и одна из карточек во втором столбце не завершена
                        } else {
                            item.disabled = areAllSecondColumnComplete;
                        }
                    });
                });
            } else {
                this.firstColumn.forEach(note => {
                    note.items.forEach(item => {
                        item.disabled = false;
                    });
                });
            }
        },
        // Метод для добавления элемента
        addItem() {
            if (this.noteTitle && this.items.length < 5 && this.firstColumn.length < 3) {
                if (this.items.some(item => item.text.trim() === '')) {
                    return; // Если введенный текст элемента пустой, прекратить выполнение метода
                }
                this.items.push({ id: Date.now(), text: '', checked: false }); // Добавление нового элемента в список items
            }
        },
        // Метод для создания группы заметок
        createNotes() {
            if (
                this.noteTitle &&
                this.items.length >= 3 &&
                this.items.length <= 5 &&
                !this.items.some(item => !item.text.trim())
            ) {
                const newNoteGroup = {
                    id: Date.now(),
                    noteTitle: this.noteTitle,
                    items: this.items,
                    isComplete: false,
                    lastChecked: null
                };

                this.firstColumn.push(newNoteGroup); // Добавление новой группы заметок в первый столбец
                this.saveData(); // Сохранение данных
                this.noteTitle = '';
                this.items = []; // Очистка полей ввода заголовка и элементов
            }
        },
        // Метод для удаления элемента
        deleteItem(index) {
            this.items.splice(index, 1); // Удаление элемента из списка items
        }
    },
    mounted() {
        this.checkDisableFirstColumn(); // Вызов метода при монтировании Vue-компонента для проверки и блокировки элементов первого столбца
    }
});