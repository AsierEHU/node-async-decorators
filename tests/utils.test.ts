import { buildOnce } from "../src/utils"
import { uniqueNumber, mockFunction, mockErrorFunction } from "./utils"

describe("Execute once Test", () => {

    const rn1 = uniqueNumber()
    const rn2 = uniqueNumber()

    test("Execute once function returns expected right results", async () => {
        const once = buildOnce();
        const resultReal = await mockFunction(rn1, rn2)
        const result = await once(
            () => mockFunction(rn1, rn2),
            []
        )
        expect(result).toEqual(resultReal)
    })

    test("Execute once function returns expected exception results", async () => {
        const once = buildOnce();
        let errorReal: unknown = null;
        try {
            await mockErrorFunction(rn1, rn2)
        } catch (e) {
            errorReal = e
        }
        let errorOnce: unknown = null;
        try {
            await once(
                () => mockErrorFunction(rn1, rn2),
                []
            )
        } catch (e) {
            errorOnce = e
        }
        expect(errorOnce).toEqual(errorReal)
    })

    test("Original function is only called once (for the same context)", async () => {
        const once = buildOnce();
        const spyedFunction = jest.fn(mockFunction)
        await Promise.all([
            once(
                () => spyedFunction(3, 6),
                []
            ),
            once(
                () => spyedFunction(4, 7),
                []
            ),
            once(
                () => spyedFunction(5, 8),
                []
            )
        ])
        expect(spyedFunction).toBeCalledTimes(1)
    })

    test("Original function is called as many times as different contexts", async () => {
        const once = buildOnce();
        const spyedFunction = jest.fn(mockFunction)
        await Promise.all([
            once(
                () => spyedFunction(3, 6),
                ["hello", 5]
            ),
            once(
                () => spyedFunction(4, 7),
                ["other"]
            ),
            once(
                () => spyedFunction(5, 8),
                [5, "hello"]
            ),
            once(
                () => spyedFunction(7, 0),
                []
            )
        ])
        expect(spyedFunction).toBeCalledTimes(4)
    })
})
