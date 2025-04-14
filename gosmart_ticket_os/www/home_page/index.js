    const main  = document.querySelector('main');
    const navbar = document.querySelector('.navbar')[0];
    const operation_list = document.querySelector('#operation-list')

    main.classList.remove('container');
    main.classList.remove('my-4');

    
    document.addEventListener('DOMContentLoaded', () => {
        createCounter('ships', 3, 152, 100);
        createCounter('containers', 500, 35000, 100);
        createCounter('trucks', 1000, 182000, 80);
        createCounter('dry-bulk', 2000, 235000, 80);
        createCounter('animals', 1000, 140000, 80);
        createCounter('wet-bulk', 2500, 385000, 80);
    });

    function createCounter(elementId, incrementValue, maxValue, interval) { 
        let counter = 0; 
        const element = document.getElementById(elementId); 
        function updateCounter() { 
            if (counter < maxValue) { 
                counter += incrementValue; 
                element.textContent = counter; 
            } else { 
                clearInterval(intervalId); 
            } 
        } 
        const intervalId = setInterval(updateCounter, interval); 
    }
