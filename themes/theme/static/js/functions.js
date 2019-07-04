/*
jQuery(document).ready(function() {
  jQuery(function() {
      jQuery('.nav-prev').click(function(){
          location.href = jQuery(this).attr('href');
      });
      jQuery('.nav-next').click(function() {
          location.href = jQuery(this).attr('href');
      });
  });

  jQuery(document).keydown(function(e) {
    // prev links - left arrow key
    if(e.which == '37') {
      jQuery('.nav.nav-prev').click();
    }

    // next links - right arrow key
    if(e.which == '39') {
      jQuery('.nav.nav-next').click();
    }
  });
});
*/

$(document).ready(function() {
    //запрашиваем индекс 
    $.get('/search-index.json', function(resp) {
        // если сервер не простивил заголовки и ответ пришёл строкой
        // то сами распаковываем
        if (typeof resp === 'string')
            resp = JSON.parse(resp);

        // инициализируем
        init_search(resp);
    });
});

function init_search(index_list) {
    // сколько максимально строк в поиске
    let max_items = 10;

    // вешаем слушатель событий на ввод
    $('.search-wr').on('input', 'input', function() {
        let value = $(this).val(); // получаем содержиме input'а
        if (!value) return; // ничего не делаем если пустая строка

        //список того что нашли
        let found = [];
        //последовательно идём по индексу
        for (var i = 0; i < index_list.length; i++) {
            // важно копировать элементы, т.к. иначе мы будем изменять их в идексе
            let item = Object.assign({}, index_list[i]);

            // сначала ищем в title потом в content
            ['title', 'content'].every(type => {
                //сохраняем позицию на которой нашли
                item.index = item[type].indexOf(value)
                if (item.index !== -1) { // если оказалось что нашли
                    item.found = type; // то сохраняем где нашли
                    found.push(item); // добавляем в список
                    return false; // и выходим из проверки этого элемента
                }
                return true;
            });
        }

        // сортируем то, что нашли
        found.sort((a, b) => {
            // выставляем вес полю, котором нашли.
            let type_weight = { // чем больше вес тем ниже выводится
                title: 0, // в данном случае я предположил, что сначала
                content:1 // выводятся те где нашли в title, потом в content
            };
            // собственно сравнение по типу
            if (a.found !== b.found)
                return type_weight[a.found] - type_weight[b.found];
            // иначе сортируем по позиции вхождения
            // чем ближе к началу строки тем выше
            return a.index - b.index;
        });

        // выводим, но не больше max_items
        print_items(found.slice(0, max_items));

    });

    function print_items(list) {
        // пихаем в #search-results склеиные строки
        $('#search-results').html(
            list // из каждого элемента делаем строку
                .map(item => `<li><a class="item" href="${item.uri}">${item.title}</a></li>`)
                // после этого склеиваем разделяя переносом
                .join('\n') 
        );
    }
}