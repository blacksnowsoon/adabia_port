    const main  = document.querySelector('main');
    const navbar = document.querySelector('.navbar')[0];
    const operation_list = document.querySelector('#operation-list')

    main.classList.remove('container');
    main.classList.remove('my-4');

    
    // document.addEventListener('DOMContentLoaded', () => {
    


    //     createCounter('ships', 1, 152, 100);
    //     createCounter('containers', 350, 35000, 100);
    //     createCounter('trucks', 1000, 182000, 100);
    //     createCounter('dry-bulk', 1000, 235000, 100);
    //     createCounter('animals', 1000, 140000, 100);
    //     createCounter('wet-bulk', 1500, 385000, 100);
    

    // });

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
