/*!
 * Copyright 2020 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { DebugElement, Type } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AngularWidgetObjectFinder } from './angular-widget-finder';
import { BaseWidgetObject, FindableWidget } from './widget-object';
import { CorrectReturnTypes, LocatorDriver } from './widget-object';

/**
 * Knows how to find Angular TestElements in the DOM.
 */
export class AngularLocatorDriver implements LocatorDriver<TestElement> {
    constructor(private testElement: TestElement, private rootElement: DebugElement) {}

    /**
     * @inheritdoc
     */
    get(cssSelector: string): AngularLocatorDriver {
        const elements = this.testElement.elements;
        const nextElements = [].concat(...elements.map((element) => element.queryAll(By.css(cssSelector))));
        return new AngularLocatorDriver(new TestElement(nextElements, this.testElement.fixture), this.rootElement);
    }

    /**
     * @inheritdoc
     */
    getByText(cssSelector: string, value: string): AngularLocatorDriver {
        const elements = this.testElement.elements;
        let nextElements: DebugElement[] = [].concat(
            ...elements.map((element) => element.queryAll(By.css(cssSelector)))
        );
        nextElements = nextElements.filter((el) => el.nativeElement.textContent.includes(value));
        return new AngularLocatorDriver(new TestElement(nextElements, this.testElement.fixture), this.rootElement);
    }

    /**
     * @inheritdoc
     */
    parents(cssSelector: string): AngularLocatorDriver {
        return new AngularLocatorDriver(
            new TestElement(
                this.testElement.elements.map((el) => this.findParent(cssSelector, el.parent)),
                this.testElement.fixture
            ),
            this.rootElement
        );
    }

    /**
     * Looks up the chain of debug elements until it finds a parent that matches the CSS selector.
     * Checks the given element.
     */
    private findParent(cssSelector: string, debugElement: DebugElement): DebugElement {
        if (!debugElement) {
            return undefined;
        } else if (debugElement.nativeElement.matches(cssSelector)) {
            return debugElement;
        } else {
            return this.findParent(cssSelector, debugElement.parent);
        }
    }

    /**
     * @inheritdoc
     */
    unwrap(): TestElement {
        return this.testElement;
    }

    /**
     * @inheritdoc
     */
    findWidget<W extends BaseWidgetObject<TestElement>, C extends FindableWidget<TestElement, W>>(
        widget: C,
        cssSelector?: string
    ): CorrectReturnTypes<InstanceType<C>, TestElement> {
        return new AngularWidgetObjectFinder(this.testElement.fixture).find(widget, this.rootElement, cssSelector);
    }
}

/**
 * A wrapper around an array of DebugElements that adds convenience methods.
 * Avoid accessing the debug elements at all costs.
 *
 * Can be used in a `for ... of ...` loop to inspect all the sub elements within this TestElement.
 *
 * @example
 * for (const el of testElement) {
 *     expect(el.enabled()).toBeTruthy()
 * }
 */
export class TestElement implements Iterable<TestElement> {
    constructor(public elements: DebugElement[], public fixture: ComponentFixture<any>) {}

    /**
     * Gives the text of the first element.
     */
    text(): string {
        return this.elements[0].nativeElement.textContent.trim();
    }

    /**
     * Gives the value of the first element.
     */
    value(): string {
        return this.elements[0].nativeElement.value;
    }

    /**
     * Says if this element is enabled.
     */
    enabled(): boolean {
        return !this.elements[0].nativeElement.disabled;
    }

    /**
     * Clicks all of the elements contained.
     */
    click(): void {
        this.elements.map((element) => element.nativeElement.click());
        this.fixture.detectChanges();
    }

    /**
     * Blurs all the contained elements.
     */
    blur(): void {
        this.elements.map((el) => el.nativeElement.dispatchEvent(new Event('blur')));
        this.fixture.detectChanges();
    }

    /**
     * Clears the input on all the contained elements.
     */
    clear(): void {
        this.elements.map((el) => (el.nativeElement.value = ''));
        this.fixture.detectChanges();
    }

    /**
     * Says how many elements are contained in this TestElement.
     */
    length(): number {
        return this.elements.length;
    }

    /**
     * Runs change detection with the component fixture.
     */
    detectChanges(): void {
        this.fixture.detectChanges();
    }

    /**
     * Gives the elements contained within this TestElement where each element is its own TestElement
     */
    toArray(): TestElement[] {
        return this.elements.map((el) => new TestElement([el], this.fixture));
    }

    /**
     * Allows a TestElement to be used in a `for ... of ...` loop.
     */
    [Symbol.iterator](): Iterator<TestElement, any, undefined> {
        let counter = 0;
        return {
            next: () => {
                counter += 1;
                return {
                    done: counter === this.elements.length,
                    value: new TestElement([this.elements[counter]], this.fixture),
                };
            },
        };
    }
}
