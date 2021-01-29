import { SortFn } from '../types'
import { get } from 'lodash'

const stringSort: SortFn = (path, a, b, _columnId, desc) => {
    const aItem = get(a, path)
    const bItem = get(b, path)
    let ret = 0
    if (desc) {
        ret =  aItem.localeCompare(bItem)
    }
    ret =  bItem.localeCompare(aItem)
    return ret
}

const numberSort: SortFn = (path, a, b, _columnId, desc) => {
    const aItem = get(a, path)
    const bItem = get(b, path)
    let ret = 0
    if (desc) {
        ret =  bItem- aItem
    }
    ret =  aItem- bItem
    return ret
}

const dateSort: SortFn = (path, a, b, _columnId, desc) => {
    const aItem = get(a, path)
    const bItem = get(b, path)
    let ret = 0
    if (desc) {
        ret =  bItem- aItem
    }
    ret =  aItem- bItem
    return ret
}

export { stringSort,numberSort,dateSort }