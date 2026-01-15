import { animate } from 'animejs';

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Validate that a target is a valid DOM element
 * @param {any} element - Element to validate
 * @returns {boolean} - True if valid HTMLElement
 */
const isValidHTMLElement = (element) => {
    return (
        element != null &&
        typeof element === 'object' &&
        element.nodeType === 1 &&
        element instanceof HTMLElement &&
        element.isConnected !== false
    );
};

/**
 * Fade in and slide up animation
 * @param {HTMLElement|HTMLElement[]} ref - Element(s) to animate
 * @param {number} delay - Delay in milliseconds
 * @param {object} options - Additional animation options
 */
export const fadeInUp = (ref, delay = 0, options = {}) => {
    if (prefersReducedMotion()) return;
    
    if (!ref) return;
    
    // Handle ref objects (React refs)
    const element = ref?.current || ref;
    if (!element) return;
    
    const elements = Array.isArray(element) ? element : [element];
    const validElements = elements.filter(isValidHTMLElement);
    
    if (validElements.length === 0) return;
    
    try {
        animate({
            targets: validElements,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: options.duration || 600,
            delay: (el, i) => delay + (options.stagger || 0) * i,
            easing: 'easeOutCubic',
            ...options,
        });
    } catch (error) {
        // Silently fail - animation errors should not crash the app
        console.warn('Animation error (fadeInUp):', error);
    }
};

/**
 * Simple fade in animation
 * @param {HTMLElement|HTMLElement[]} ref - Element(s) to animate
 * @param {number} delay - Delay in milliseconds
 * @param {object} options - Additional animation options
 */
export const fadeIn = (ref, delay = 0, options = {}) => {
    if (prefersReducedMotion()) return;
    
    if (!ref) return;
    
    // Handle ref objects (React refs)
    const element = ref?.current || ref;
    if (!element) return;
    
    const elements = Array.isArray(element) ? element : [element];
    const validElements = elements.filter(isValidHTMLElement);
    
    if (validElements.length === 0) return;
    
    try {
        animate({
            targets: validElements,
            opacity: [0, 1],
            duration: options.duration || 500,
            delay: delay,
            easing: 'easeOutQuad',
            ...options,
        });
    } catch (error) {
        // Silently fail - animation errors should not crash the app
        console.warn('Animation error (fadeIn):', error);
    }
};

/**
 * Count up animation for numbers
 * @param {HTMLElement} ref - Element containing the number
 * @param {number} from - Starting value
 * @param {number} to - Ending value
 * @param {object} options - Additional options (formatFn, duration, etc.)
 */
export const countUp = (ref, from, to, options = {}) => {
    // Handle ref objects (React refs)
    const element = ref?.current || ref;
    
    if (!element || !isValidHTMLElement(element)) {
        return;
    }
    
    if (prefersReducedMotion()) {
        if (options.formatFn) {
            element.textContent = options.formatFn(to);
        } else {
            element.textContent = to.toLocaleString('ru-RU');
        }
        return;
    }
    
    const formatFn = options.formatFn || ((val) => Math.floor(val).toLocaleString('ru-RU'));
    const duration = options.duration || 700;
    
    try {
        animate({
            targets: { value: from },
            value: to,
            duration: duration,
            easing: 'easeOutCubic',
            update: function(anim) {
                if (element && isValidHTMLElement(element)) {
                    try {
                        element.textContent = formatFn(anim.progress === 100 ? to : anim.animatables[0].target.value);
                    } catch (e) {
                        // Ignore update errors
                    }
                }
            },
            ...options,
        });
    } catch (error) {
        // Fallback to immediate value if animation fails
        if (element && isValidHTMLElement(element)) {
            element.textContent = formatFn(to);
        }
        console.warn('Animation error (countUp):', error);
    }
};

/**
 * Slide in from direction
 * @param {HTMLElement|HTMLElement[]} ref - Element(s) to animate
 * @param {string} direction - 'left', 'right', 'top', 'bottom'
 * @param {number} delay - Delay in milliseconds
 * @param {object} options - Additional animation options
 */
export const slideIn = (ref, direction = 'left', delay = 0, options = {}) => {
    if (prefersReducedMotion()) {
        fadeIn(ref, delay, options);
        return;
    }
    
    if (!ref) return;
    
    // Handle ref objects (React refs)
    const element = ref?.current || ref;
    if (!element) return;
    
    const elements = Array.isArray(element) ? element : [element];
    const validElements = elements.filter(isValidHTMLElement);
    
    if (validElements.length === 0) return;
    
    const translateMap = {
        left: [-20, 0],
        right: [20, 0],
        top: [0, -20],
        bottom: [0, 20],
    };
    
    const translate = translateMap[direction] || [0, 0];
    
    try {
        animate({
            targets: validElements,
            opacity: [0, 1],
            translateX: direction === 'left' || direction === 'right' ? translate : 0,
            translateY: direction === 'top' || direction === 'bottom' ? translate : 0,
            duration: options.duration || 500,
            delay: delay,
            easing: 'easeOutCubic',
            ...options,
        });
    } catch (error) {
        // Silently fail - animation errors should not crash the app
        console.warn('Animation error (slideIn):', error);
    }
};

/**
 * Fade out and collapse animation (for removing elements)
 * @param {HTMLElement} ref - Element to animate out
 * @param {function} onComplete - Callback when animation completes
 */
export const fadeOutCollapse = (ref, onComplete) => {
    if (prefersReducedMotion()) {
        if (onComplete) onComplete();
        return;
    }
    
    // Handle ref objects (React refs)
    const element = ref?.current || ref;
    
    if (!element || !isValidHTMLElement(element)) {
        if (onComplete) onComplete();
        return;
    }
    
    try {
        const computedStyle = getComputedStyle(element);
        const marginTop = parseFloat(computedStyle.marginTop) || 0;
        const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        
        animate({
            targets: element,
            opacity: [1, 0],
            height: [element.offsetHeight, 0],
            marginTop: [marginTop, 0],
            marginBottom: [marginBottom, 0],
            paddingTop: [paddingTop, 0],
            paddingBottom: [paddingBottom, 0],
            duration: 300,
            easing: 'easeInQuad',
            complete: () => {
                if (onComplete) onComplete();
            },
        });
    } catch (error) {
        // If animation fails, just call onComplete immediately
        console.warn('Animation error (fadeOutCollapse):', error);
        if (onComplete) onComplete();
    }
};

/**
 * Staggered fade in up for grid items
 * @param {HTMLElement[]} refs - Array of elements
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} stagger - Stagger delay between items
 */
export const staggerFadeInUp = (refs, baseDelay = 0, stagger = 50) => {
    if (prefersReducedMotion()) {
        fadeIn(refs, baseDelay);
        return;
    }
    
    fadeInUp(refs, baseDelay, { stagger });
};

